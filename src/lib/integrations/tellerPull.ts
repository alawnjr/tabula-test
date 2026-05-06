// Pulls accounts + balances + transactions from Teller (or returns mock data)
// and converts to ExtractedDoc.

import type {
  BankTransaction,
  ExtractedDoc,
  ExtractedItem,
} from "./types";
import { isTellerConfigured } from "./demoMode";
import {
  tellerGet,
  type TellerAccount,
  type TellerBalance,
  type TellerTransaction,
} from "./tellerClient";
import { redactDeep } from "./redact";
import { aggregateTransactionsToItems } from "./tellerAggregate";

const DEFAULT_MONTHS = 6;
const MAX_MONTHS = 12;
const MAX_PAGES_PER_ACCOUNT = 50;

function depositSubtypeToSchema(
  subtype?: string
): "checking" | "savings" | "moneyMarket" | "cd" | "brokerage" | "other" {
  switch (subtype) {
    case "checking":
      return "checking";
    case "savings":
      return "savings";
    case "money_market":
      return "moneyMarket";
    case "certificate_of_deposit":
      return "cd";
    default:
      return "other";
  }
}

function parseAmount(s: string | null | undefined): number {
  if (!s) return 0;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function transactionMonths(override?: number): number {
  if (typeof override === "number" && Number.isFinite(override) && override > 0) {
    return Math.min(MAX_MONTHS, Math.floor(override));
  }
  const raw = process.env.TELLER_TRANSACTION_MONTHS;
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_MONTHS;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_MONTHS;
  return Math.min(MAX_MONTHS, n);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function pullTransactionsForAccount(
  accessToken: string,
  acct: TellerAccount,
  cutoffISO: string
): Promise<BankTransaction[]> {
  const out: BankTransaction[] = [];
  let fromId: string | undefined;
  for (let page = 0; page < MAX_PAGES_PER_ACCOUNT; page++) {
    const path = fromId
      ? `/accounts/${acct.id}/transactions?from_id=${encodeURIComponent(fromId)}`
      : `/accounts/${acct.id}/transactions`;
    let batch: TellerTransaction[];
    try {
      batch = await tellerGet<TellerTransaction[]>(accessToken, path);
    } catch {
      break;
    }
    if (!batch.length) break;
    let crossedCutoff = false;
    for (const t of batch) {
      if (t.date < cutoffISO) {
        crossedCutoff = true;
        continue;
      }
      out.push({
        accountId: acct.id,
        accountLast4: acct.last_four,
        date: t.date,
        description: t.description,
        amount: parseAmount(t.amount),
        status: t.status,
        category: t.details?.category,
      });
    }
    if (crossedCutoff) break;
    const last = batch[batch.length - 1];
    if (!last) break;
    fromId = last.id;
  }
  return out;
}

export async function pullTellerData(
  accessToken: string,
  monthsOverride?: number
): Promise<ExtractedDoc> {
  if (!isTellerConfigured() || accessToken === "demo-access-token") {
    return mockTellerExtraction(monthsOverride);
  }

  const accounts = await tellerGet<TellerAccount[]>(accessToken, "/accounts");
  const items: ExtractedItem[] = [];
  let institutionLabel = "Bank";

  const months = transactionMonths(monthsOverride);
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffISO = isoDate(cutoff);
  const transactions: BankTransaction[] = [];

  for (const acct of accounts) {
    institutionLabel = acct.institution?.name ?? institutionLabel;
    let balance = 0;
    try {
      const bal = await tellerGet<TellerBalance>(
        accessToken,
        `/accounts/${acct.id}/balances`
      );
      balance = parseAmount(bal.ledger ?? bal.available);
    } catch {
      // Skip balance on error — we still emit the account row.
    }

    if (acct.type === "depository") {
      items.push({
        kind: "depositAccount",
        institution: acct.institution?.name ?? acct.name,
        accountType: depositSubtypeToSchema(acct.subtype),
        lastFour: acct.last_four,
        balance,
      });
      const txs = await pullTransactionsForAccount(accessToken, acct, cutoffISO);
      transactions.push(...txs);
    } else if (acct.type === "credit") {
      items.push({
        kind: "unsecuredDebt",
        claimType: "other",
        creditorName: acct.name ?? acct.institution?.name ?? "Credit card",
        lastFour: acct.last_four,
        claimAmount: Math.abs(balance),
        basis: "Credit card",
      });
    }
  }

  transactions.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  items.push(...aggregateTransactionsToItems(transactions));

  const rawSummary =
    transactions.length > 0
      ? `Pulled ${transactions.length} transactions across ${
          accounts.filter((a) => a.type === "depository").length
        } depository account(s) from ${cutoffISO} to ${isoDate(today)}.`
      : undefined;

  return redactDeep({
    source: "teller",
    sourceLabel: `Teller: ${institutionLabel}`,
    extractedAt: new Date().toISOString(),
    items,
    rawSummary,
    transactions,
    transactionWindow: { fromISO: cutoffISO, toISO: isoDate(today) },
  }) as ExtractedDoc;
}

function mockTellerExtraction(monthsOverride?: number): ExtractedDoc {
  const months = transactionMonths(monthsOverride);
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setMonth(cutoff.getMonth() - months);
  const transactions = mockTransactions(cutoff, today);

  const items: ExtractedItem[] = [
    {
      kind: "depositAccount",
      institution: "Teller Sandbox Bank",
      accountType: "checking",
      lastFour: "0000",
      balance: 1284.32,
    },
    {
      kind: "depositAccount",
      institution: "Teller Sandbox Bank",
      accountType: "savings",
      lastFour: "1111",
      balance: 8420.5,
    },
    {
      kind: "unsecuredDebt",
      claimType: "other",
      creditorName: "Platinum Card",
      lastFour: "7857",
      claimAmount: 2150.04,
      basis: "Credit card",
    },
    ...aggregateTransactionsToItems(transactions),
  ];

  return {
    source: "teller",
    sourceLabel: "Teller (demo)",
    extractedAt: new Date().toISOString(),
    rawSummary: `[DEMO MOCK] Connected sandbox bank. ${transactions.length} synthetic transactions from ${isoDate(
      cutoff
    )} to ${isoDate(today)}.`,
    items,
    transactions,
    transactionWindow: { fromISO: isoDate(cutoff), toISO: isoDate(today) },
  };
}

function mockTransactions(from: Date, to: Date): BankTransaction[] {
  const out: BankTransaction[] = [];
  const cursor = new Date(from);
  cursor.setDate(1);
  while (cursor <= to) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const mk = (day: number, description: string, amount: number, category?: string): BankTransaction => ({
      accountId: "acc_mock_checking",
      accountLast4: "0000",
      date: isoDate(new Date(year, month, day)),
      description,
      amount,
      status: "posted",
      category,
    });
    if (cursor <= to) out.push(mk(1, "Payroll - Acme Co", 3200, "income"));
    if (cursor <= to) out.push(mk(2, "Rent - 123 Main St", -1450, "rent"));
    if (cursor <= to) out.push(mk(5, "Electric utility", -110.32, "utilities"));
    if (cursor <= to) out.push(mk(7, "Grocery - Trader Joes", -184.5, "groceries"));
    if (cursor <= to) out.push(mk(15, "Payroll - Acme Co", 3200, "income"));
    if (cursor <= to) out.push(mk(20, "Auto loan payment", -310, "loan"));
    if (cursor <= to) out.push(mk(25, "Phone bill", -65, "utilities"));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out
    .filter((t) => t.date >= isoDate(from) && t.date <= isoDate(to))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
