import type { CaseRecord, FormData } from "@/state/case-store";

function num(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function sumGroup(form: FormData | undefined, groupId: string, field: string): number {
  if (!form) return 0;
  const items = form[groupId];
  if (!Array.isArray(items)) return 0;
  return items.reduce<number>((acc, row) => {
    if (row && typeof row === "object") {
      return acc + num((row as Record<string, unknown>)[field]);
    }
    return acc;
  }, 0);
}

function fieldsTotal(form: FormData | undefined, fields: string[]): number {
  if (!form) return 0;
  return fields.reduce((acc, f) => acc + num(form[f]), 0);
}

export function totalRealEstate(forms: Record<string, FormData>): number {
  return sumGroup(forms["106AB"], "realEstate", "currentValue");
}

export function totalVehicles(forms: Record<string, FormData>): number {
  return sumGroup(forms["106AB"], "vehicles", "currentValue");
}

export function totalPersonal(forms: Record<string, FormData>): number {
  const f = forms["106AB"];
  return fieldsTotal(f, [
    "householdGoods",
    "electronics",
    "collectibles",
    "sportsEquipment",
    "firearms",
    "clothes",
    "jewelry",
    "animals",
    "otherPersonal",
  ]);
}

export function totalFinancial(forms: Record<string, FormData>): number {
  const f = forms["106AB"];
  const cash = num(f?.cashOnHand);
  const deposits = sumGroup(f, "depositAccounts", "balance");
  const investments = sumGroup(f, "bondsAndStocks", "value");
  const retirement = sumGroup(f, "retirement", "value");
  const security = sumGroup(f, "securityDeposits", "amount");
  const other = sumGroup(f, "otherFinancialAssets", "value");
  return cash + deposits + investments + retirement + security + other;
}

export function totalBusiness(forms: Record<string, FormData>): number {
  const f = forms["106AB"];
  return fieldsTotal(f, [
    "accountsReceivable",
    "officeEquipment",
    "machinery",
    "inventory",
    "intangibles",
    "otherBusiness",
  ]);
}

export function totalFarm(forms: Record<string, FormData>): number {
  const f = forms["106AB"];
  return fieldsTotal(f, [
    "farmAnimals",
    "crops",
    "farmEquipment",
    "farmSupplies",
    "otherFarm",
  ]);
}

export function totalOtherProperty(forms: Record<string, FormData>): number {
  return sumGroup(forms["106AB"], "otherProperty", "value");
}

export function totalAssets(forms: Record<string, FormData>) {
  const realEstate = totalRealEstate(forms);
  const vehicles = totalVehicles(forms);
  const personal = totalPersonal(forms);
  const financial = totalFinancial(forms);
  const business = totalBusiness(forms);
  const farm = totalFarm(forms);
  const other = totalOtherProperty(forms);
  return {
    realEstate,
    vehicles,
    personal,
    financial,
    business,
    farm,
    other,
    grand: realEstate + vehicles + personal + financial + business + farm + other,
  };
}

export function totalSecuredClaims(forms: Record<string, FormData>): number {
  return sumGroup(forms["106D"], "securedCreditors", "claimAmount");
}

export function totalPriorityUnsecured(forms: Record<string, FormData>): number {
  return sumGroup(forms["106EF"], "priorityCreditors", "totalClaim");
}

export function totalNonpriorityUnsecured(forms: Record<string, FormData>): number {
  return sumGroup(forms["106EF"], "nonpriorityCreditors", "claimAmount");
}

export function totalLiabilities(forms: Record<string, FormData>) {
  const secured = totalSecuredClaims(forms);
  const priority = totalPriorityUnsecured(forms);
  const nonpriority = totalNonpriorityUnsecured(forms);
  return { secured, priority, nonpriority, grand: secured + priority + nonpriority };
}

const D1_DEDUCTIONS = [
  "d1PayrollTax",
  "d1MandatoryRetirement",
  "d1VoluntaryRetirement",
  "d1RepaymentLoans",
  "d1Insurance",
  "d1DomesticSupport",
  "d1UnionDues",
  "d1OtherDeductions",
];
const D2_DEDUCTIONS = [
  "d2PayrollTax",
  "d2MandatoryRetirement",
  "d2VoluntaryRetirement",
  "d2RepaymentLoans",
  "d2Insurance",
  "d2DomesticSupport",
  "d2UnionDues",
  "d2OtherDeductions",
];

export function monthlyIncome(forms: Record<string, FormData>) {
  const f = forms["106I"];
  const d1Gross = num(f?.d1GrossWages) + num(f?.d1OvertimePay);
  const d2Gross = num(f?.d2GrossWages) + num(f?.d2OvertimePay);
  const d1Deductions = fieldsTotal(f, D1_DEDUCTIONS);
  const d2Deductions = fieldsTotal(f, D2_DEDUCTIONS);
  const d1Net = d1Gross - d1Deductions;
  const d2Net = d2Gross - d2Deductions;
  const otherD1 = sumGroup(f, "otherIncome", "debtor1Amount");
  const otherD2 = sumGroup(f, "otherIncome", "debtor2Amount");
  return {
    d1Gross,
    d2Gross,
    d1Deductions,
    d2Deductions,
    d1Net,
    d2Net,
    otherD1,
    otherD2,
    combined: d1Net + d2Net + otherD1 + otherD2,
  };
}

const J_EXPENSE_FIELDS = [
  "rentMortgage",
  "realEstateTaxes",
  "propertyInsurance",
  "homeMaintenance",
  "hoa",
  "utilitiesElectricity",
  "utilitiesWater",
  "utilitiesPhone",
  "food",
  "childcare",
  "clothing",
  "personalCare",
  "medical",
  "transportation",
  "entertainment",
  "charity",
  "lifeInsurance",
  "healthInsurance",
  "vehicleInsurance",
  "otherInsurance",
  "taxesNotDeducted",
  "carPayments",
  "otherInstallments",
  "alimonySupport",
  "supportNotIncluded",
  "otherRealProperty",
  "otherExpenses",
];

export function monthlyExpenses(forms: Record<string, FormData>): number {
  return fieldsTotal(forms["106J"], J_EXPENSE_FIELDS);
}

export function monthlyNet(forms: Record<string, FormData>): number {
  return monthlyIncome(forms).combined - monthlyExpenses(forms);
}

export function caseSummary(record: CaseRecord) {
  return {
    assets: totalAssets(record.forms),
    liabilities: totalLiabilities(record.forms),
    income: monthlyIncome(record.forms),
    expenses: monthlyExpenses(record.forms),
    net: monthlyNet(record.forms),
  };
}

export function eaStats(forms: Record<string, FormData>) {
  const intake = forms["ea-intake"] ?? {};
  const inventory = forms["ea-inventory"] ?? {};
  const liabilities = forms["ea-liabilities"] ?? {};
  const beneficiaries = forms["ea-beneficiaries"] ?? {};

  const realProperty = sumGroup(inventory, "realProperty", "dateOfDeathValue");
  const financial = sumGroup(inventory, "financialAccounts", "dateOfDeathValue");
  const retirement = sumGroup(inventory, "retirementAccounts", "dateOfDeathValue");
  const lifeInsurance = sumGroup(inventory, "lifeInsurance", "deathBenefit");
  const vehicles = sumGroup(inventory, "vehicles", "dateOfDeathValue");
  const personal = sumGroup(inventory, "personalProperty", "dateOfDeathValue");
  const business = sumGroup(inventory, "businessInterests", "dateOfDeathValue");
  const grossEstate =
    realProperty + financial + retirement + lifeInsurance + vehicles + personal + business;

  const knownDebts = sumGroup(liabilities, "knownDebts", "amount");
  const filedClaims = sumGroup(liabilities, "creditorClaims", "claimedAmount");
  const adminExpenses = fieldsTotal(liabilities, [
    "funeralExpenses",
    "lastIllnessExpenses",
    "fiduciaryCommissions",
    "attorneyFees",
    "accountantFees",
    "courtFees",
    "otherAdminExpenses",
  ]);
  const totalLiabilities = knownDebts + filedClaims + adminExpenses;

  const beneficiaryList = Array.isArray(beneficiaries.beneficiaries)
    ? (beneficiaries.beneficiaries as unknown[])
    : [];
  const beneficiaryCount = beneficiaryList.length;

  const dod = (intake.decedentDod as string | undefined) ?? null;
  const daysSinceDod = dod
    ? Math.max(0, Math.floor((Date.now() - new Date(dod).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    grossEstate,
    realProperty,
    financial,
    retirement,
    lifeInsurance,
    vehicles,
    personal,
    business,
    totalLiabilities,
    knownDebts,
    filedClaims,
    adminExpenses,
    netEstate: grossEstate - totalLiabilities,
    beneficiaryCount,
    decedentDod: dod,
    daysSinceDod,
    domicileState: (intake.domicileState as string | undefined) ?? null,
    willStatus: (intake.willExists as string | undefined) ?? null,
    letterStatus: (intake.letterStatus as string | undefined) ?? null,
    lettersIssuedDate: (intake.lettersIssuedDate as string | undefined) ?? null,
  };
}

export function piStats(forms: Record<string, FormData>) {
  const intake = forms["pi-intake"] ?? {};
  const damages = forms["pi-damages"] ?? {};
  const claim = forms["pi-claim"] ?? {};
  const totalDamages =
    num(damages.totalMedicalBills) +
    num(damages.estimatedFutureMedical) +
    num(damages.propertyDamage) +
    num(damages.totalLostWages) +
    num(damages.futureLostWages);
  return {
    incidentType: (intake.incidentType as string | undefined) ?? null,
    incidentDate: (intake.incidentDate as string | undefined) ?? null,
    totalDamages,
    settlementStatus: (claim.settlementStatus as string | undefined) ?? null,
    demandAmount: num(claim.demandAmount),
    offerAmount: num(claim.offerAmount),
  };
}

