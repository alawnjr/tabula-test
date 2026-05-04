// Pulls accounts + liabilities from Plaid (or returns mock data) and converts
// to ExtractedDoc.

import type { ExtractedDoc, ExtractedItem } from "./types";
import { isPlaidConfigured } from "./demoMode";
import { getPlaidClient } from "./plaidClient";
import { redactDeep } from "./redact";

type AnyAcct = {
  account_id?: string;
  name?: string;
  official_name?: string;
  mask?: string | null;
  type?: string;
  subtype?: string;
  balances?: { current?: number | null; available?: number | null };
  institution_name?: string;
};

function depositSubtypeToSchema(
  subtype?: string
): "checking" | "savings" | "moneyMarket" | "cd" | "brokerage" | "other" {
  switch (subtype) {
    case "checking":
      return "checking";
    case "savings":
      return "savings";
    case "money market":
      return "moneyMarket";
    case "cd":
      return "cd";
    case "brokerage":
      return "brokerage";
    default:
      return "other";
  }
}

export async function pullPlaidData(
  accessToken: string
): Promise<ExtractedDoc> {
  if (!isPlaidConfigured() || accessToken === "demo-access-token") {
    return mockPlaidExtraction();
  }

  const client = getPlaidClient();
  const items: ExtractedItem[] = [];

  // Accounts (deposit, retirement)
  const accountsResp = await client.accountsGet({ access_token: accessToken });
  const institution = accountsResp.data.item.institution_id ?? "Bank";
  for (const acct of accountsResp.data.accounts as AnyAcct[]) {
    if (acct.type === "depository") {
      items.push({
        kind: "depositAccount",
        institution: acct.official_name ?? acct.name ?? institution,
        accountType: depositSubtypeToSchema(acct.subtype),
        lastFour: acct.mask ?? undefined,
        balance: acct.balances?.current ?? 0,
      });
    } else if (acct.type === "investment" && acct.subtype !== "brokerage") {
      items.push({
        kind: "retirement",
        accountType: acct.subtype ?? "investment",
        institution: acct.official_name ?? acct.name ?? institution,
        value: acct.balances?.current ?? 0,
      });
    }
  }

  // Liabilities (mortgages, student loans, credit cards)
  try {
    const liab = await client.liabilitiesGet({ access_token: accessToken });
    const accountById = new Map<string, AnyAcct>();
    for (const acct of liab.data.accounts as AnyAcct[]) {
      if (acct.account_id) accountById.set(acct.account_id, acct);
    }
    const L = liab.data.liabilities;

    for (const m of L.mortgage ?? []) {
      const acct = accountById.get(m.account_id ?? "");
      items.push({
        kind: "securedDebt",
        lienType: "mortgage",
        creditorName: acct?.name ?? "Mortgage lender",
        lastFour: acct?.mask ?? undefined,
        claimAmount: Math.abs(acct?.balances?.current ?? 0),
        collateralDescription: m.property_address?.street ?? "",
      });
    }
    for (const s of L.student ?? []) {
      const acct = accountById.get(s.account_id ?? "");
      items.push({
        kind: "unsecuredDebt",
        claimType: "studentLoans",
        creditorName: s.servicer_address?.city
          ? `${acct?.name ?? "Servicer"}`
          : acct?.name ?? "Student loan servicer",
        lastFour: acct?.mask ?? undefined,
        claimAmount: Math.abs(acct?.balances?.current ?? 0),
        basis: "Student loan",
      });
    }
    for (const c of L.credit ?? []) {
      const acct = accountById.get(c.account_id ?? "");
      items.push({
        kind: "unsecuredDebt",
        claimType: "other",
        creditorName: acct?.name ?? "Credit card",
        lastFour: acct?.mask ?? undefined,
        claimAmount: Math.abs(acct?.balances?.current ?? 0),
        basis: "Credit card",
      });
    }
  } catch {
    // Liabilities product not enabled or item doesn't have it — skip silently.
  }

  return redactDeep({
    source: "plaid",
    sourceLabel: `Plaid: ${institution}`,
    extractedAt: new Date().toISOString(),
    items,
  }) as ExtractedDoc;
}

function mockPlaidExtraction(): ExtractedDoc {
  return {
    source: "plaid",
    sourceLabel: "Plaid (demo)",
    extractedAt: new Date().toISOString(),
    rawSummary:
      "[DEMO MOCK] Connected sandbox bank with one checking, one savings, one credit card, and one mortgage.",
    items: [
      {
        kind: "depositAccount",
        institution: "Plaid Sandbox Bank",
        accountType: "checking",
        lastFour: "0000",
        balance: 110.0,
      },
      {
        kind: "depositAccount",
        institution: "Plaid Sandbox Bank",
        accountType: "savings",
        lastFour: "1111",
        balance: 210.0,
      },
      {
        kind: "unsecuredDebt",
        claimType: "other",
        creditorName: "Plaid Credit Card",
        lastFour: "3333",
        claimAmount: 410.0,
        basis: "Credit card",
      },
      {
        kind: "securedDebt",
        lienType: "mortgage",
        creditorName: "Plaid Mortgage",
        lastFour: "8888",
        claimAmount: 56302.06,
        collateralDescription: "2992 Cameron Road",
      },
    ],
  };
}
