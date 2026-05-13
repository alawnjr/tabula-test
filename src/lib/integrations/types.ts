// Normalized intermediate shape produced by extraction (Claude) or Teller pulls.
// The mapping layer converts ExtractedDoc → FormPatch[].

export type ExtractionSource = "upload" | "teller" | "manual";

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

// Aggregated monthly average derived from N months of bank transactions.
// Targets a scalar field on Schedule I (income) or Schedule J (expenses).
export type MonthlyScalarItem = {
  kind: "monthlyScalar";
  formId: "106I" | "106J";
  fieldId: string;
  amount: number;
  description: string; // e.g. "Avg of 6 months: 12 transactions, total $7,200"
};

// Aggregated other-income row → Schedule I "otherIncome" repeating group.
export type MonthlyOtherIncomeItem = {
  kind: "monthlyOtherIncome";
  type:
    | "businessNet"
    | "interest"
    | "familySupport"
    | "unemployment"
    | "socialSecurity"
    | "government"
    | "pension"
    | "other";
  description: string;
  debtor1Amount: number;
};

// === Estate-admin extraction items ===
// Used when the case is an `estateAdmin` matter. The extraction prompt
// receives the practice area and returns these kinds rather than the
// bankruptcy kinds above.

export type EaDecedentItem = {
  kind: "eaDecedent";
  nameFirst?: string;
  nameMiddle?: string;
  nameLast?: string;
  dob?: string; // YYYY-MM-DD
  dod?: string; // YYYY-MM-DD
  ssnLast4?: string;
  domicileState?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
};

export type EaBeneficiaryItem = {
  kind: "eaBeneficiary";
  name?: string;
  relationship?: string;
  sharePercent?: number;
  contingent?: boolean;
};

export type EaBequestItem = {
  kind: "eaBequest";
  beneficiaryName?: string;
  description?: string;
  estimatedValue?: number;
};

export type EaRealPropertyItem = {
  kind: "eaRealProperty";
  description?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  parcelId?: string;
  titleType?: string;
  dateOfDeathValue?: number;
  mortgageBalance?: number;
};

export type EaFinancialAccountItem = {
  kind: "eaFinancialAccount";
  institution?: string;
  accountType?: string;
  lastFour?: string;
  titleType?: string;
  todBeneficiary?: string;
  dateOfDeathValue?: number;
};

export type EaRetirementAccountItem = {
  kind: "eaRetirementAccount";
  institution?: string;
  accountType?: string;
  lastFour?: string;
  designatedBeneficiary?: string;
  designatedContingent?: string;
  dateOfDeathValue?: number;
};

export type EaLifeInsuranceItem = {
  kind: "eaLifeInsurance";
  insurer?: string;
  policyNumber?: string;
  owner?: string;
  designatedBeneficiary?: string;
  estateIsBeneficiary?: boolean;
  deathBenefit?: number;
};

export type EaVehicleItem = {
  kind: "eaVehicle";
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  titleType?: string;
  dateOfDeathValue?: number;
  loanBalance?: number;
};

export type EaDebtItem = {
  kind: "eaDebt";
  creditor?: string;
  debtKind?: string;
  lastFour?: string;
  amount?: number;
  incurredDate?: string;
  secured?: boolean;
};

export type ExtractedItem =
  | DepositAccountItem
  | SecuredDebtItem
  | UnsecuredDebtItem
  | RealEstateItem
  | VehicleItem
  | RetirementItem
  | PayStubItem
  | MonthlyScalarItem
  | MonthlyOtherIncomeItem
  | EaDecedentItem
  | EaBeneficiaryItem
  | EaBequestItem
  | EaRealPropertyItem
  | EaFinancialAccountItem
  | EaRetirementAccountItem
  | EaLifeInsuranceItem
  | EaVehicleItem
  | EaDebtItem;

export type BankTransaction = {
  accountId: string;
  accountLast4?: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // negative = outflow, positive = inflow
  status: "posted" | "pending";
  category?: string;
};

export type ExtractedDoc = {
  source: ExtractionSource;
  sourceLabel: string; // e.g. "chase-jan-statement.pdf" or "Teller: Chase Sapphire"
  extractedAt: string; // ISO timestamp
  items: ExtractedItem[];
  rawSummary?: string; // optional human-readable summary from Claude
  // Bank statement history. Populated by Teller pull over a configurable
  // window (default 6 months). Not converted to FormPatches yet — surfaced
  // on the review page so a human can use them for means-test / Schedule I/J.
  transactions?: BankTransaction[];
  transactionWindow?: { fromISO: string; toISO: string };
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
