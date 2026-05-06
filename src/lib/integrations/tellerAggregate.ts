// Classifies bank transactions into Schedule I/J monthly-average buckets.
// Heuristics use Teller's `details.category` enrichment when present; fall
// back to keyword matches on the description. The output is a list of
// ExtractedItems (one per non-zero bucket) ready for buildPatches().

import type {
  BankTransaction,
  ExtractedItem,
  MonthlyOtherIncomeItem,
  MonthlyScalarItem,
} from "./types";

// Income buckets — positive transactions only.
type IncomeBucket =
  | "wages" // → 106I.d1GrossWages (scalar)
  | "socialSecurity" // → 106I.otherIncome[]
  | "unemployment"
  | "interest"
  | "pension"
  | "familySupport"
  | "businessNet"
  | "ignore"; // transfers / refunds — not real income

// Expense buckets — negative transactions; map to 106J scalar fields.
type ExpenseBucket =
  | "rentMortgage"
  | "utilitiesElectricity"
  | "utilitiesWater"
  | "utilitiesPhone"
  | "food"
  | "childcare"
  | "clothing"
  | "personalCare"
  | "medical"
  | "transportation"
  | "entertainment"
  | "charity"
  | "vehicleInsurance"
  | "healthInsurance"
  | "lifeInsurance"
  | "otherInsurance"
  | "taxesNotDeducted"
  | "carPayments"
  | "otherInstallments"
  | "alimonySupport"
  | "homeMaintenance"
  | "otherExpenses"
  | "ignore"; // payments to credit cards / transfers — handled elsewhere

const EXPENSE_LABEL: Record<Exclude<ExpenseBucket, "ignore">, string> = {
  rentMortgage: "rent / mortgage",
  utilitiesElectricity: "electricity / heat / gas",
  utilitiesWater: "water / sewer / garbage",
  utilitiesPhone: "phone / internet / cable",
  food: "food + groceries",
  childcare: "childcare / education",
  clothing: "clothing",
  personalCare: "personal care",
  medical: "medical / dental",
  transportation: "transportation",
  entertainment: "entertainment",
  charity: "charity / donations",
  vehicleInsurance: "vehicle insurance",
  healthInsurance: "health insurance",
  lifeInsurance: "life insurance",
  otherInsurance: "other insurance",
  taxesNotDeducted: "taxes not deducted from wages",
  carPayments: "car payments",
  otherInstallments: "other installment payments",
  alimonySupport: "alimony / child support",
  homeMaintenance: "home maintenance",
  otherExpenses: "other",
};

const INCOME_TYPE_LABEL: Record<
  Exclude<IncomeBucket, "wages" | "ignore">,
  MonthlyOtherIncomeItem["type"]
> = {
  socialSecurity: "socialSecurity",
  unemployment: "unemployment",
  interest: "interest",
  pension: "pension",
  familySupport: "familySupport",
  businessNet: "businessNet",
};

function classifyIncome(t: BankTransaction): IncomeBucket {
  const d = t.description.toLowerCase();
  if (/\b(payroll|direct\s*dep|direct\s*deposit|salary|wages?)\b/.test(d)) {
    return "wages";
  }
  if (/\b(ssa|social\s*security)\b/.test(d)) return "socialSecurity";
  if (/\b(unemployment|ui\s*benefit|edd)\b/.test(d)) return "unemployment";
  if (/\b(interest|dividend)\b/.test(d)) return "interest";
  if (/\b(pension|retirement\s*payout|annuity)\b/.test(d)) return "pension";
  if (/\b(child\s*support|alimony)\b/.test(d)) return "familySupport";
  if (t.category === "income") return "wages";
  // transfer in, refund, deposit from credit card → ignore
  if (/\b(transfer|venmo|zelle|paypal|refund|return|reversal|credit\s*card)\b/.test(d)) {
    return "ignore";
  }
  return "ignore";
}

function classifyExpense(t: BankTransaction): ExpenseBucket {
  const d = t.description.toLowerCase();
  // Description keyword wins over category, since category is generic.
  if (/\b(rent|mortgage)\b/.test(d)) return "rentMortgage";
  if (/\b(electric|pg&e|coned|duke\s*energy|gas\s*co|utility)\b/.test(d)) return "utilitiesElectricity";
  if (/\b(water|sewer|garbage|waste)\b/.test(d)) return "utilitiesWater";
  if (/\b(phone|verizon|at&t|t-?mobile|comcast|xfinity|spectrum|internet|cable)\b/.test(d)) return "utilitiesPhone";
  if (/\b(geico|allstate|progressive|state\s*farm|auto\s*insurance|car\s*insurance)\b/.test(d)) return "vehicleInsurance";
  if (/\b(health\s*ins|aetna|cigna|blue\s*cross|kaiser|medical\s*ins)\b/.test(d)) return "healthInsurance";
  if (/\b(life\s*insurance|metlife|prudential)\b/.test(d)) return "lifeInsurance";
  if (/\b(daycare|preschool|tuition|school)\b/.test(d)) return "childcare";
  if (/\b(uber|lyft|gas|fuel|chevron|shell|exxon|bp|metro|transit|bart|caltrain|parking)\b/.test(d)) return "transportation";
  if (/\b(netflix|spotify|hulu|theater|cinema|movie|concert|disney)\b/.test(d)) return "entertainment";
  if (/\b(donation|charity|gofundme|red\s*cross)\b/.test(d)) return "charity";
  if (/\b(cvs|walgreens|rite\s*aid|pharmacy|hospital|clinic|dental)\b/.test(d)) return "medical";
  if (/\b(child\s*support|alimony)\b/.test(d)) return "alimonySupport";
  if (/\b(auto\s*loan|car\s*loan|car\s*payment)\b/.test(d)) return "carPayments";
  if (/\b(transfer|venmo|zelle|paypal|cash\s*app|payment\s*to\s*card|credit\s*card\s*pmt)\b/.test(d)) {
    return "ignore";
  }

  switch (t.category) {
    case "groceries":
    case "dining":
    case "bar":
      return "food";
    case "fuel":
    case "transport":
    case "transportation":
      return "transportation";
    case "phone":
      return "utilitiesPhone";
    case "utilities":
      return "utilitiesElectricity";
    case "accommodation":
    case "home":
      return "rentMortgage";
    case "health":
      return "medical";
    case "clothing":
      return "clothing";
    case "entertainment":
    case "sport":
      return "entertainment";
    case "charity":
      return "charity";
    case "education":
      return "childcare";
    case "insurance":
      return "otherInsurance";
    case "tax":
      return "taxesNotDeducted";
    case "loan":
      return "otherInstallments";
    default:
      return "otherExpenses";
  }
}

function monthsCovered(transactions: BankTransaction[]): number {
  if (!transactions.length) return 0;
  const months = new Set<string>();
  for (const t of transactions) months.add(t.date.slice(0, 7));
  return Math.max(1, months.size);
}

export function aggregateTransactionsToItems(
  transactions: BankTransaction[]
): ExtractedItem[] {
  if (!transactions.length) return [];
  const monthCount = monthsCovered(transactions);

  // Income: sum positive amounts per bucket.
  const incomeTotals = new Map<IncomeBucket, { total: number; count: number }>();
  // Expenses: sum absolute negative amounts per bucket.
  const expenseTotals = new Map<
    ExpenseBucket,
    { total: number; count: number }
  >();

  for (const t of transactions) {
    if (t.amount > 0) {
      const bucket = classifyIncome(t);
      if (bucket === "ignore") continue;
      const cur = incomeTotals.get(bucket) ?? { total: 0, count: 0 };
      cur.total += t.amount;
      cur.count += 1;
      incomeTotals.set(bucket, cur);
    } else if (t.amount < 0) {
      const bucket = classifyExpense(t);
      if (bucket === "ignore") continue;
      const cur = expenseTotals.get(bucket) ?? { total: 0, count: 0 };
      cur.total += -t.amount;
      cur.count += 1;
      expenseTotals.set(bucket, cur);
    }
  }

  const items: ExtractedItem[] = [];

  // Wages → 106I scalar `d1GrossWages`.
  const wages = incomeTotals.get("wages");
  if (wages && wages.total > 0) {
    items.push({
      kind: "monthlyScalar",
      formId: "106I",
      fieldId: "d1GrossWages",
      amount: round2(wages.total / monthCount),
      description: `Avg of ${monthCount} mo: ${wages.count} payroll-like deposits, total $${fmt(
        wages.total
      )}`,
    } satisfies MonthlyScalarItem);
  }

  // Other income → 106I.otherIncome[] repeating group.
  for (const [bucket, agg] of incomeTotals) {
    if (bucket === "wages" || bucket === "ignore") continue;
    if (agg.total <= 0) continue;
    items.push({
      kind: "monthlyOtherIncome",
      type: INCOME_TYPE_LABEL[bucket],
      description: `${agg.count} deposits over ${monthCount} mo (auto-classified ${bucket})`,
      debtor1Amount: round2(agg.total / monthCount),
    } satisfies MonthlyOtherIncomeItem);
  }

  // Expenses → 106J scalar fields.
  for (const [bucket, agg] of expenseTotals) {
    if (bucket === "ignore") continue;
    if (agg.total <= 0) continue;
    items.push({
      kind: "monthlyScalar",
      formId: "106J",
      fieldId: bucket,
      amount: round2(agg.total / monthCount),
      description: `Avg of ${monthCount} mo: ${agg.count} ${EXPENSE_LABEL[bucket]} txns, total $${fmt(
        agg.total
      )}`,
    } satisfies MonthlyScalarItem);
  }

  return items;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
