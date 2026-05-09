// Computes the means-test verdict from the 122A-1 + 122A-2 form data.
//
// The numbers below are simplified placeholders. In production these would
// come from the per-state median tables published by the U.S. Trustee
// Program and refreshed twice a year. For the demo we use a reasonable
// 2025 ballpark for a household of 1, plus a +$10k bump per additional
// member. The thresholds for the means test itself ($9,075 / $15,150)
// match the form's actual cutoffs.

import type { CaseRecord, FormData } from "@/state/case-store";

function num(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function sumFields(form: FormData | undefined, fields: string[]): number {
  if (!form) return 0;
  return fields.reduce((acc, f) => acc + num(form[f]), 0);
}

const D1_INCOME_FIELDS = [
  "mt1d1Wages",
  "mt1d1Business",
  "mt1d1Rental",
  "mt1d1InterestDividends",
  "mt1d1Pension",
  "mt1d1Unemployment",
  "mt1d1Support",
  "mt1d1Other",
];

const D2_INCOME_FIELDS = [
  "mt1d2Wages",
  "mt1d2Business",
  "mt1d2Rental",
  "mt1d2InterestDividends",
  "mt1d2Pension",
  "mt1d2Unemployment",
  "mt1d2Support",
  "mt1d2Other",
];

const EXCLUSION_FIELDS = [
  "mt1ExcludedSocialSecurity",
  "mt1ExcludedVictim",
];

const NATIONAL_FIELDS = [
  "mt2NationalFoodEtc",
  "mt2NationalHealthUnder65",
  "mt2NationalHealthOver65",
];

const LOCAL_FIELDS = [
  "mt2HousingNonMortgage",
  "mt2HousingMortgage",
  "mt2TransportOperating",
  "mt2TransportOwnership",
  "mt2TransportOwnership2",
  "mt2PublicTransport",
];

const OTHER_NECESSARY_FIELDS = [
  "mt2Taxes",
  "mt2InvoluntaryDeductions",
  "mt2Insurance",
  "mt2CourtOrdered",
  "mt2EducationDisabled",
  "mt2ChildcareEducation",
  "mt2HealthcareNotCovered",
  "mt2TelecomBeyondBasic",
];

const ADDITIONAL_FIELDS = [
  "mt2HealthInsurance",
  "mt2DependentCare",
  "mt2Protection",
  "mt2EnergyExcess",
  "mt2EducationChildren",
  "mt2FoodClothingExcess",
  "mt2Charity",
];

const DEBT_FIELDS = [
  "mt2SecuredDebtAvg",
  "mt2SecuredArrears",
  "mt2PriorityClaims",
];

// Simplified 2025-era state median annual income for a household of 1.
// Production would replace this with the official UST table per state.
const MEDIAN_BASE_BY_STATE: Record<string, number> = {
  CA: 76000,
  TX: 65000,
  NY: 72000,
  FL: 64000,
  IL: 70000,
  WA: 78000,
  MA: 80000,
  CO: 75000,
  NJ: 82000,
  GA: 64000,
  PA: 68000,
  OH: 64000,
  MI: 64000,
  AZ: 65000,
  NC: 62000,
  VA: 75000,
  MN: 72000,
  WI: 66000,
  OR: 70000,
  MD: 78000,
};

const DEFAULT_MEDIAN_BASE = 65000; // fallback if state not listed
const ADDITIONAL_MEMBER_INCREMENT = 10000;

// Form 122A-2 thresholds (Bankruptcy Code §707(b)(2)):
const SAFE_HARBOR_60MO = 9075; // monthly disposable × 60 below this → safe
const PRESUMPTION_60MO = 15150; // monthly disposable × 60 above this → presumed

export type MeansTestResult = {
  cmiMonthly: number;
  cmiAnnual: number;
  medianAnnual: number;
  belowMedian: boolean;
  state: string;
  householdSize: number;

  totalDeductions: number;
  monthlyDisposable: number;
  disposable60: number;

  verdict:
    | "below-median"
    | "safe-harbor"
    | "no-presumption"
    | "uncertain"
    | "presumption-of-abuse"
    | "incomplete";
  verdictLabel: string;
  verdictDetail: string;
  // Plain-English list of what the user still needs to provide before the
  // verdict is meaningful. Empty when there's enough data for a real answer.
  missing: string[];
};

export function computeMeansTest(record: CaseRecord): MeansTestResult {
  const a1 = record.forms["122A-1"];
  const a2 = record.forms["122A-2"];

  const rawHouseholdSize = num(a1?.householdSize);
  const householdSize = Math.max(1, rawHouseholdSize || 1);
  const state = (a1?.residenceState as string | undefined) ?? "";
  const maritalStatus = (a1?.maritalStatus as string | undefined) ?? "";

  const d1 = sumFields(a1, D1_INCOME_FIELDS);
  const d2 = sumFields(a1, D2_INCOME_FIELDS);
  const exclusions = sumFields(a1, EXCLUSION_FIELDS);
  const cmiMonthly = Math.max(0, d1 + d2 - exclusions);
  const cmiAnnual = cmiMonthly * 12;

  const base = MEDIAN_BASE_BY_STATE[state] ?? DEFAULT_MEDIAN_BASE;
  const medianAnnual =
    base + Math.max(0, householdSize - 1) * ADDITIONAL_MEMBER_INCREMENT;

  const belowMedian = cmiAnnual <= medianAnnual;

  const totalDeductions =
    sumFields(a2, NATIONAL_FIELDS) +
    sumFields(a2, LOCAL_FIELDS) +
    sumFields(a2, OTHER_NECESSARY_FIELDS) +
    sumFields(a2, ADDITIONAL_FIELDS) +
    sumFields(a2, DEBT_FIELDS);

  const monthlyDisposable = cmiMonthly - totalDeductions;
  const disposable60 = monthlyDisposable * 60;

  // Build a "what's still needed" list. We treat missing income or missing
  // household basics as data-incomplete; missing 122A-2 only matters when
  // we're above the median.
  const missing: string[] = [];
  if (!maritalStatus) missing.push("Marital status (122A-1)");
  if (!state) missing.push("State of residence (122A-1)");
  if (!rawHouseholdSize) missing.push("Household size (122A-1)");
  const noIncomeEntered = d1 + d2 === 0;
  if (noIncomeEntered) {
    missing.push(
      "At least one monthly-income figure for Debtor 1 or Debtor 2 (122A-1)"
    );
  }
  const a2Untouched =
    !a2 ||
    Object.keys(a2).length === 0 ||
    [...NATIONAL_FIELDS, ...LOCAL_FIELDS, ...OTHER_NECESSARY_FIELDS].every(
      (f) => !num(a2?.[f])
    );

  let verdict: MeansTestResult["verdict"];
  let verdictLabel: string;
  let verdictDetail: string;

  // We can't produce a meaningful verdict until we know income, household
  // size, and state — without those, "below median" is just an artifact of
  // empty fields, not an answer.
  const dataInsufficientForA1 =
    noIncomeEntered || !state || !rawHouseholdSize;

  if (dataInsufficientForA1) {
    verdict = "incomplete";
    verdictLabel = "Not enough data";
    verdictDetail =
      "Tabula needs income, household size, and state of residence on Form 122A-1 to compare against the state median. Fill those in or upload pay stubs / bank statements to proceed.";
  } else if (belowMedian) {
    verdict = "below-median";
    verdictLabel = "Eligible for Chapter 7";
    verdictDetail =
      "Your annualized current monthly income is at or below the state median for your household size. The presumption of abuse does not arise — Form 122A-2 is not required.";
  } else if (a2Untouched) {
    verdict = "uncertain";
    verdictLabel = "Above median — finish 122A-2";
    verdictDetail =
      "Your annualized income exceeds the state median, so the means-test calculation in Form 122A-2 must be completed before eligibility can be determined.";
    missing.push("Allowed deductions on Form 122A-2");
  } else if (disposable60 < SAFE_HARBOR_60MO) {
    verdict = "safe-harbor";
    verdictLabel = "Eligible for Chapter 7";
    verdictDetail =
      "After allowed deductions your projected 60-month disposable income is below the safe-harbor threshold. The presumption of abuse does not arise.";
  } else if (disposable60 >= PRESUMPTION_60MO) {
    verdict = "presumption-of-abuse";
    verdictLabel = "Presumption of abuse — Chapter 13 likely";
    verdictDetail =
      "Your 60-month disposable income is at or above the presumption threshold. A Chapter 7 filing would be presumed abusive. Chapter 13 is the typical path.";
  } else {
    verdict = "no-presumption";
    verdictLabel = "Eligible — review with counsel";
    verdictDetail =
      "Your 60-month disposable income falls between the safe-harbor and presumption thresholds. Whether the presumption arises depends on whether disposable income covers at least 25% of nonpriority unsecured debt — confirm with counsel.";
  }

  return {
    cmiMonthly,
    cmiAnnual,
    medianAnnual,
    belowMedian,
    state,
    householdSize,
    totalDeductions,
    monthlyDisposable,
    disposable60,
    verdict,
    verdictLabel,
    verdictDetail,
    missing,
  };
}

export const MEANS_TEST_THRESHOLDS = {
  safeHarbor60: SAFE_HARBOR_60MO,
  presumption60: PRESUMPTION_60MO,
};
