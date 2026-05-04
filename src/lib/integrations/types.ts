// Normalized intermediate shape produced by extraction (Claude) or Plaid pulls.
// The mapping layer converts ExtractedDoc → FormPatch[].

export type ExtractionSource = "upload" | "plaid" | "manual";

export type DepositAccountItem = {
  kind: "depositAccount";
  institution?: string;
  accountType?: "checking" | "savings" | "moneyMarket" | "cd" | "brokerage" | "other";
  lastFour?: string;
  balance?: number;
};

export type SecuredDebtItem = {
  kind: "securedDebt";
  lienType: "mortgage" | "vehicle" | "judgment" | "statutory" | "security" | "other";
  creditorName?: string;
  lastFour?: string;
  claimAmount?: number;
  collateralValue?: number;
  collateralDescription?: string;
  dateIncurred?: string;
};

export type UnsecuredDebtItem = {
  kind: "unsecuredDebt";
  claimType: "studentLoans" | "domesticObligations" | "pensions" | "other";
  creditorName?: string;
  lastFour?: string;
  claimAmount?: number;
  basis?: string;
  dateIncurred?: string;
};

export type RealEstateItem = {
  kind: "realEstate";
  description?: string;
  addressLine1?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  currentValue?: number;
  lienAmount?: number;
};

export type VehicleItem = {
  kind: "vehicle";
  vehicleType?: "car" | "truck" | "motorcycle" | "rv" | "boat" | "aircraft" | "other";
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  currentValue?: number;
};

export type RetirementItem = {
  kind: "retirement";
  accountType?: string;
  institution?: string;
  value?: number;
};

export type PayStubItem = {
  kind: "payStub";
  debtor: 1 | 2;
  employer?: string;
  occupation?: string;
  grossWages?: number;
  overtimePay?: number;
  payrollTax?: number;
  mandatoryRetirement?: number;
  voluntaryRetirement?: number;
  insurance?: number;
  unionDues?: number;
  otherDeductions?: number;
};

export type ExtractedItem =
  | DepositAccountItem
  | SecuredDebtItem
  | UnsecuredDebtItem
  | RealEstateItem
  | VehicleItem
  | RetirementItem
  | PayStubItem;

export type ExtractedDoc = {
  source: ExtractionSource;
  sourceLabel: string; // e.g. "chase-jan-statement.pdf" or "Plaid: Chase Sapphire"
  extractedAt: string; // ISO timestamp
  items: ExtractedItem[];
  rawSummary?: string; // optional human-readable summary from Claude
};

// One proposed write into the case store. Mapping layer emits these,
// and the review UI applies them after the user approves.
export type FormPatch = {
  id: string; // stable id for accept/reject UI
  formId: string;
  // For repeating groups: { groupId, fieldId, fields:{} } — handled by mapper.
  // For scalar fields: { path: ["fieldId"], value }
  op:
    | { kind: "setField"; path: string[]; value: unknown }
    | { kind: "appendGroup"; groupId: string; fields: Record<string, unknown> };
  label: string; // human-readable description for the review UI
  source: ExtractionSource;
  sourceLabel: string;
};
