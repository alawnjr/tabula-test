import type { CaseRecord, FormData } from "@/state/case-store";
import { fmtCurrency, parseNum, sumGroup, type FieldMap } from "./fillPdf";
import { caseSummary } from "@/lib/derived";
import { computeMeansTest } from "@/lib/meansTest";

// --- helpers ---

function fd(record: CaseRecord, formId: string): FormData {
  return record.forms[formId] ?? {};
}

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function debtor1Name(record: CaseRecord): string {
  const f = fd(record, "101");
  return [f.debtor1NameFirst, f.debtor1NameLast].filter(Boolean).join(" ") || record.debtorName || "";
}

function debtor2Name(record: CaseRecord): string {
  const f = fd(record, "101");
  return [f.debtor2NameFirst, f.debtor2NameLast].filter(Boolean).join(" ");
}

// --- Form 101: Voluntary Petition ---

export function map101(record: CaseRecord): FieldMap {
  const f = fd(record, "101");
  return {
    "Debtor1.First name": str(f.debtor1NameFirst),
    "Debtor1.Middle name": str(f.debtor1NameMiddle),
    "Debtor1.Last name": str(f.debtor1NameLast),
    "Debtor1.Suffix Sr Jr II III": str(f.debtor1NameSuffix),
    "Debtor1.Street": str(f.residenceStreet),
    "Debtor1.Street1": str(f.residenceStreet2),
    "Debtor1.City": str(f.residenceCity),
    "Debtor1.State": str(f.residenceState),
    "Debtor1.ZIP Code": str(f.residenceZip),
    "Debtor1.County": str(f.residenceCounty),

    "Debtor2.First name": str(f.debtor2NameFirst),
    "Debtor2.Middle name_2": str(f.debtor2NameMiddle),
    "Debtor2.Last name": str(f.debtor2NameLast),
    "Suffix Sr Jr II III_2": str(f.debtor2NameSuffix),

    // chapter checkboxes
    "Check Box5": record.chapter === "chapter7",
    "Check Box7": record.chapter === "chapter13",

    // prior cases (up to 2)
    ...priorCasesMap(f),

    "Executed on": str(f.signedDate),
    "Debtor1.Date signed": str(f.signedDate),
  };
}

function priorCasesMap(f: FormData): FieldMap {
  const cases = Array.isArray(f.priorCases) ? f.priorCases as Record<string, unknown>[] : [];
  const out: FieldMap = {};
  if (cases[0]) {
    out["District"] = str(cases[0].district);
    out["Case number"] = str(cases[0].caseNumber);
    out["When"] = str(cases[0].filedDate);
  }
  if (cases[1]) {
    out["District_2"] = str(cases[1].district);
    out["Case number_2"] = str(cases[1].caseNumber);
    out["When_2"] = str(cases[1].filedDate);
  }
  return out;
}

// --- Form 106AB: Property ---

export function map106AB(record: CaseRecord): FieldMap {
  const f = fd(record, "106AB");
  const out: FieldMap = {
    "Debtor 1": debtor1Name(record),
    "Debtor 2": debtor2Name(record),
  };

  // Real estate (up to 3 slots)
  const realEstate = (Array.isArray(f.realEstate) ? f.realEstate : []) as Record<string, unknown>[];
  const reSuffixes = ["", "_2", "_3"];
  const reAmtKeys = ["1 1a", "13", "undefined_13"]; // approximate — slot 1 uses "1 1a", slot 2 uses "13", slot 3 uses "undefined_13"
  realEstate.slice(0, 3).forEach((prop, i) => {
    const s = reSuffixes[i];
    out[`City${s}`] = str(prop.locationCity);
    out[`State${s}`] = str(prop.locationState);
    out[`ZIP Code${s}`] = str(prop.locationZip);
    out[`County${s}`] = str(prop.locationCounty || "");
    out[i === 0 ? "1 1a" : i === 1 ? "13" : "undefined_13"] = fmtCurrency(prop.currentValue);
  });

  // Vehicles (up to 3 slots — slots use fields like Make, Make_2, Make_3)
  const vehicles = (Array.isArray(f.vehicles) ? f.vehicles : []) as Record<string, unknown>[];
  const vSuffixes = ["", "_2", "_3"];
  vehicles.slice(0, 3).forEach((v, i) => {
    const s = vSuffixes[i];
    out[`Make${s}`] = str(v.make);
    out[`Model${s}`] = str(v.model);
    out[`Year${s}`] = str(v.year);
    out[`Approximate mileage${s === "" ? "_2" : s === "_2" ? "_3" : "_4"}`] = str(v.mileage);
    out[`Other information${s === "" ? "_2" : s === "_2" ? "_3" : "_4"}`] = str(v.otherInfo);
  });

  // Vehicle values — slot 1 uses "undefined_14", slot 2 "undefined_16", slot 3 "undefined_18"
  vehicles.slice(0, 3).forEach((v, i) => {
    const keys = ["undefined_14", "undefined_16", "undefined_18"];
    out[keys[i]] = fmtCurrency(v.currentValue);
  });

  // Cash on hand
  out["16 Cash amount"] = fmtCurrency(f.cashOnHand);

  // Deposit accounts (up to 5 — fields 17.1 through 17.9)
  const deposits = (Array.isArray(f.depositAccounts) ? f.depositAccounts : []) as Record<string, unknown>[];
  const depAccountKeys = [
    "17.1 Checking account", "17.2 Checking account", "17.3 Checking account",
    "17.4 Checking account", "17.5 Certificates of deposit account",
  ];
  const depAmtKeys = [
    "17.1 Checking amount", "17.2 Checking amount", "17.3 Checking amount",
    "17.4 Checking amount", "17.5 Certificates of deposit amount",
  ];
  deposits.slice(0, 5).forEach((dep, i) => {
    out[depAccountKeys[i]] = [str(dep.institution), str(dep.lastFour) ? `x${str(dep.lastFour)}` : ""].filter(Boolean).join(" ");
    out[depAmtKeys[i]] = fmtCurrency(dep.balance);
  });

  // Retirement accounts (up to 7 — fields 21.1 through 21.7)
  const retirement = (Array.isArray(f.retirement) ? f.retirement : []) as Record<string, unknown>[];
  const retAccountKeys = [
    "21.1 401k or similar plan", "21.2 Pension plan", "21.3 IRA",
    "21.4 Retirement account", "21.5 Keogh", "21.6 Additional account", "21.7 Additional account",
  ];
  const retAmtKeys = [
    "21.1 401k or similar plan amount", "21.2 Pension plan amount", "21.3 IRA amount",
    "21.4 Retirement account amount", "21.5 Keogh amount", "21.6 Additional account amount", "21.7 Additional account amount",
  ];
  retirement.slice(0, 7).forEach((ret, i) => {
    out[retAccountKeys[i]] = [str(ret.institution), str(ret.type)].filter(Boolean).join(" — ");
    out[retAmtKeys[i]] = fmtCurrency(ret.value);
  });

  // Household goods (Part 3, lines 6-14 using "6 description" etc.)
  out["6 description"] = str(f.householdGoodsDesc);
  out["6 description amount"] = fmtCurrency(f.householdGoods);
  out["7 description"] = str(f.electronicsDesc);
  out["7 description amount"] = fmtCurrency(f.electronics);
  out["8 description"] = str(f.collectiblesDesc);
  out["8 description amount"] = fmtCurrency(f.collectibles);
  out["9 description"] = str(f.sportsEquipmentDesc);
  out["9 description amount"] = fmtCurrency(f.sportsEquipment);
  out["10 description"] = str(f.firearmsDesc);
  out["10 description amount"] = fmtCurrency(f.firearms);
  out["11 description"] = "Clothing";
  out["11 description amount"] = fmtCurrency(f.clothes);
  out["12 description"] = str(f.jewelryDesc);
  out["12 description amount"] = fmtCurrency(f.jewelry);
  out["13 description"] = str(f.animalsDesc);
  out["13 description amount"] = fmtCurrency(f.animals);
  out["14 description"] = str(f.otherPersonalDesc);
  out["14 description amount"] = fmtCurrency(f.otherPersonal);

  return out;
}

// --- Form 106D: Secured Creditors ---

const D_SLOTS = [
  { name: "Creditors Name", street: "Street", acct: "account number", date: "Date debt was incurred", amt: "1", collateral: "2", unsec: "3" },
  { name: "Creditors Name_2", street: "Street_2", acct: "account number 2", date: "Date debt was incurred_2", amt: "1_2", collateral: "2_2", unsec: "3_2" },
  { name: "Creditors Name_3", street: "Street_3", acct: "account number 3", date: "Date debt was incurred_3", amt: "1_3", collateral: "2_3", unsec: "3_3" },
  { name: "Creditors Name_4", street: "Street_4", acct: "account number 4", date: "Date debt was incurred_4", amt: "1_4", collateral: "2_4", unsec: "3_4" },
  { name: "Creditors Name_5", street: "Street_5", acct: "account number 5", date: "Date debt was incurred_5", amt: "1_5", collateral: "2_5", unsec: "3_5" },
];

export function map106D(record: CaseRecord): FieldMap {
  const f = fd(record, "106D");
  const creditors = (Array.isArray(f.securedCreditors) ? f.securedCreditors : []) as Record<string, unknown>[];
  const out: FieldMap = {
    "Debtor 1": debtor1Name(record),
    "Debtor 2": debtor2Name(record),
  };

  creditors.slice(0, 5).forEach((c, i) => {
    const slot = D_SLOTS[i];
    out[slot.name] = str(c.creditorName);
    out[slot.street] = [str(c.creditorStreet), str(c.creditorStreet2)].filter(Boolean).join(", ");
    out[slot.acct] = str(c.accountLast4) ? `x${str(c.accountLast4)}` : "";
    out[slot.date] = str(c.dateIncurred);
    out[slot.amt] = fmtCurrency(c.claimAmount);
    out[slot.collateral] = fmtCurrency(c.collateralValue);
    out[slot.unsec] = fmtCurrency(c.unsecuredPortion);
    out["undefined_4"] = str(c.collateralDescription);
  });

  return out;
}

// --- Form 106EF: Unsecured Creditors ---

const EF_NONPRIORITY_SLOTS = [
  { name: "Creditors Name", street: "Street", acct: "account number", date: "Date debt was incurred", amt: "1", city: "City 4.1", state: "State 4.1", zip: "Zip 4.1" },
  { name: "Creditors Name_2", street: "Street_2", acct: "account number 2", date: "Date debt was incurred_2", amt: "1_2", city: "City 4.2", state: "State 4.2", zip: "Zip 4.2" },
  { name: "Creditors Name_3", street: "Street_3", acct: "account number 3", date: "Date debt was incurred_3", amt: "1_3", city: "City 4.3", state: "State 4.3", zip: "Zip 4.3" },
  { name: "Creditors Name_4", street: "Street_4", acct: "account number 4", date: "Date debt was incurred_4", amt: "1_4", city: "City 4.4", state: "State 4.4", zip: "Zip 4.4" },
  { name: "Creditors Name_5", street: "Street_5", acct: "account number 5", date: "Date debt was incurred_5", amt: "4_5", city: "City 4.5", state: "State 4.5", zip: "Zip 4.5" },
  { name: "Creditors Name_6", street: "Street_6", acct: "account number 6", date: "Date debt was incurred_6", city: "City 4.6", state: "State 4.6", zip: "Zip 4.6" },
];

export function map106EF(record: CaseRecord): FieldMap {
  const f = fd(record, "106EF");
  const out: FieldMap = {
    "Debtor 1": debtor1Name(record),
    "Debtor 2": debtor2Name(record),
  };

  const nonpriority = (Array.isArray(f.nonpriorityCreditors) ? f.nonpriorityCreditors : []) as Record<string, unknown>[];
  nonpriority.slice(0, 6).forEach((c, i) => {
    const slot = EF_NONPRIORITY_SLOTS[i];
    out[slot.name] = str(c.creditorName);
    out[slot.street] = str(c.creditorStreet);
    out[slot.acct] = str(c.accountLast4) ? `x${str(c.accountLast4)}` : "";
    out[slot.date] = str(c.dateIncurred);
    if (slot.amt) out[slot.amt] = fmtCurrency(c.claimAmount);
    out[slot.city] = str(c.creditorCity);
    out[slot.state] = str(c.creditorState);
    out[slot.zip] = str(c.creditorZip);
  });

  // Totals
  const npTotal = sumGroup(f.nonpriorityCreditors, "claimAmount");
  out["Total_6j"] = fmtCurrency(npTotal);

  return out;
}

// --- Form 106I: Income ---

export function map106I(record: CaseRecord): FieldMap {
  const f = fd(record, "106I");
  const out: FieldMap = {
    "Debtor 1": debtor1Name(record),
    "Debtor 2": debtor2Name(record),
  };

  // Debtor 1 employment
  out["Occupation Debtor 1"] = str(f.debtor1Occupation);
  out["Employers Name Debtor 1"] = str(f.debtor1Employer);
  out["Employers Street1 Debtor 1"] = str(f.debtor1EmployerStreet);
  out["Employers City Debtor 1"] = str(f.debtor1EmployerCity);
  out["Employers State Debtor 1"] = str(f.debtor1EmployerState);
  out["Employers Zip debtor 1"] = str(f.debtor1EmployerZip);

  // Debtor 2 employment
  out["Occupation Debtor 2"] = str(f.debtor2Occupation);
  out["Employers Name Debtor 2"] = str(f.debtor2Employer);
  out["Employers Street1 Debtor 2"] = str(f.debtor2EmployerStreet);
  out["Employers City Debtor 2"] = str(f.debtor2EmployerCity);
  out["Employers State Debtor 2"] = str(f.debtor2EmployerState);
  out["Employers Zip debtor 2"] = str(f.debtor2EmployerZip);

  // Monthly income — Debtor 1
  const d1Gross = parseNum(f.d1GrossWages) + parseNum(f.d1OvertimePay);
  out["Amount 2 Debtor 1"] = fmtCurrency(d1Gross);
  out["Amount 5a Debtor 1"] = fmtCurrency(f.d1PayrollTax);
  out["Amount 5b Debtor 1"] = fmtCurrency(f.d1MandatoryRetirement);
  out["Amount 5c Debtor 1"] = fmtCurrency(f.d1VoluntaryRetirement);
  out["Amount 5d Debtor 1"] = fmtCurrency(f.d1RepaymentLoans);
  out["Amount 5e Debtor 1"] = fmtCurrency(f.d1Insurance);
  out["Amount 5f Debtor 1"] = fmtCurrency(f.d1DomesticSupport);
  out["Amount 5g Debtor 1"] = fmtCurrency(f.d1UnionDues);
  out["Amount 5h Debtor 1"] = fmtCurrency(f.d1OtherDeductions);
  out["Other deductions 5h"] = str(f.d1OtherDeductionsDesc);

  const d1Deductions = [
    "d1PayrollTax", "d1MandatoryRetirement", "d1VoluntaryRetirement",
    "d1RepaymentLoans", "d1Insurance", "d1DomesticSupport", "d1UnionDues", "d1OtherDeductions",
  ].reduce((acc, k) => acc + parseNum(f[k]), 0);
  out["Amount 6 Debtor 1"] = fmtCurrency(d1Deductions);
  out["Amount 7 Debtor 1"] = fmtCurrency(d1Gross - d1Deductions);

  // Monthly income — Debtor 2
  const d2Gross = parseNum(f.d2GrossWages) + parseNum(f.d2OvertimePay);
  out["Amount 2 Debtor 2"] = fmtCurrency(d2Gross);
  out["Amount 5a Debtor 2"] = fmtCurrency(f.d2PayrollTax);
  out["Amount 5b Debtor 2"] = fmtCurrency(f.d2MandatoryRetirement);
  out["Amount 5c Debtor 2"] = fmtCurrency(f.d2VoluntaryRetirement);
  out["Amount 5d Debtor 2"] = fmtCurrency(f.d2RepaymentLoans);
  out["Amount 5e Debtor 2"] = fmtCurrency(f.d2Insurance);
  out["Amount 5f Debtor 2"] = fmtCurrency(f.d2DomesticSupport);
  out["Amount 5g Debtor 2"] = fmtCurrency(f.d2UnionDues);
  out["Amount 5h Debtor 2"] = fmtCurrency(f.d2OtherDeductions);

  const d2Deductions = [
    "d2PayrollTax", "d2MandatoryRetirement", "d2VoluntaryRetirement",
    "d2RepaymentLoans", "d2Insurance", "d2DomesticSupport", "d2UnionDues", "d2OtherDeductions",
  ].reduce((acc, k) => acc + parseNum(f[k]), 0);
  out["Amount 6 Debtor 2"] = fmtCurrency(d2Deductions);
  out["Amount 7 Debtor 2"] = fmtCurrency(d2Gross - d2Deductions);

  // Other income (lines 8a-8h) from otherIncome repeating group
  const otherIncome = (Array.isArray(f.otherIncome) ? f.otherIncome : []) as Record<string, unknown>[];
  // Map by type to the right 8x field
  const typeToField: Record<string, { d1: string; d2: string }> = {
    businessNet: { d1: "Amount 8a Debtor 1", d2: "Amount 8a Debtor 2" },
    interest:    { d1: "Amount 8b Debtor 1", d2: "Amount 8b Debtor 2" },
    familySupport: { d1: "Amount 8c Debtor 1", d2: "Amount 8c Debtor 2" },
    unemployment: { d1: "Amount 8d Debtor 1", d2: "Amount 8d Debtor 2" },
    socialSecurity: { d1: "Amount 8e Debtor 1", d2: "Amount 8e Debtor 2" },
    government:  { d1: "Amount 8f Debtor 1", d2: "Amount 8f Debtor 2" },
    pension:     { d1: "Amount 8g Debtor 1", d2: "Amount 8g Debtor 2" },
    other:       { d1: "Amount 8h Debtor 1", d2: "Amount 8h Debtor 2" },
  };
  for (const item of otherIncome) {
    const mapping = typeToField[str(item.type)];
    if (mapping) {
      out[mapping.d1] = fmtCurrency(item.debtor1Amount);
      out[mapping.d2] = fmtCurrency(item.debtor2Amount);
    }
  }

  const d1OtherTotal = otherIncome.reduce((acc, item) => acc + parseNum(item.debtor1Amount), 0);
  const d2OtherTotal = otherIncome.reduce((acc, item) => acc + parseNum(item.debtor2Amount), 0);
  out["Amount 9 Debtor 1"] = fmtCurrency(d1OtherTotal);
  out["Amount 9 Debtor 2"] = fmtCurrency(d2OtherTotal);
  out["Amount 10 Debtor 1"] = fmtCurrency(d1Gross - d1Deductions + d1OtherTotal);
  out["Amount 10 Debtor 2"] = fmtCurrency(d2Gross - d2Deductions + d2OtherTotal);
  out["Amount 11"] = fmtCurrency(
    d1Gross - d1Deductions + d1OtherTotal + d2Gross - d2Deductions + d2OtherTotal
  );

  return out;
}

// --- Form 106J: Expenses ---

export function map106J(record: CaseRecord): FieldMap {
  const f = fd(record, "106J");
  const out: FieldMap = {
    "Debtor 1": debtor1Name(record),
    "Debtor 2": debtor2Name(record),
  };

  // Dependents
  const dependents = (Array.isArray(f.dependents) ? f.dependents : []) as Record<string, unknown>[];
  const depSlots = [
    { rel: "Dependant Relation 2a", age: "Dependant age 2a" },
    { rel: "Dependant Relation 2b", age: "Dependant age 2b" },
    { rel: "Dependant Relation 2c", age: "Dependant age 2c" },
    { rel: "Dependant Relation 2d", age: "Dependant age 2d" },
    { rel: "Dependant Relation 2e", age: "Dependant age 2e" },
  ];
  dependents.slice(0, 5).forEach((dep, i) => {
    out[depSlots[i].rel] = str(dep.relationship);
    out[depSlots[i].age] = str(dep.age);
  });

  // Monthly expenses — mapped to line numbers in form 106J
  out["4"] = fmtCurrency(f.rentMortgage);
  out["4a"] = fmtCurrency(f.realEstateTaxes);
  out["4b"] = fmtCurrency(f.propertyInsurance);
  out["4c"] = fmtCurrency(f.homeMaintenance);
  out["4d"] = fmtCurrency(f.hoa);
  out["6a"] = fmtCurrency(f.utilitiesElectricity);
  out["6b"] = fmtCurrency(f.utilitiesWater);
  out["6c"] = fmtCurrency(f.utilitiesPhone);
  out["7"] = fmtCurrency(f.food);
  out["8"] = fmtCurrency(f.childcare);
  out["9"] = fmtCurrency(f.clothing);
  out["10"] = fmtCurrency(f.personalCare);
  out["11"] = fmtCurrency(f.medical);
  out["12"] = fmtCurrency(f.transportation);
  out["13"] = fmtCurrency(f.entertainment);
  out["14"] = fmtCurrency(f.charity);
  out["15a"] = fmtCurrency(f.lifeInsurance);
  out["15b"] = fmtCurrency(f.healthInsurance);
  out["15c"] = fmtCurrency(f.vehicleInsurance);
  out["15d"] = fmtCurrency(f.otherInsurance);
  out["Other 15d"] = str(f.otherInsuranceDesc);
  out["16"] = fmtCurrency(f.taxesNotDeducted);
  out["17a"] = fmtCurrency(f.carPayments);
  out["17c"] = fmtCurrency(f.otherInstallments);
  out["18"] = fmtCurrency(f.alimonySupport);
  out["19"] = fmtCurrency(f.supportNotIncluded);
  out["20a"] = fmtCurrency(f.otherRealProperty);
  out["21"] = fmtCurrency(f.otherExpenses);
  out["Other 21"] = str(f.otherExpensesDesc);

  // Compute total
  const expenseFields = [
    "rentMortgage", "realEstateTaxes", "propertyInsurance", "homeMaintenance", "hoa",
    "utilitiesElectricity", "utilitiesWater", "utilitiesPhone",
    "food", "childcare", "clothing", "personalCare", "medical", "transportation",
    "entertainment", "charity", "lifeInsurance", "healthInsurance", "vehicleInsurance", "otherInsurance",
    "taxesNotDeducted", "carPayments", "otherInstallments", "alimonySupport", "supportNotIncluded",
    "otherRealProperty", "otherExpenses",
  ];
  const total = expenseFields.reduce((acc, k) => acc + parseNum(f[k]), 0);
  out["23a"] = fmtCurrency(total);

  return out;
}

// --- Form 106Sum: Summary ---

export function map106Sum(record: CaseRecord): FieldMap {
  const s = caseSummary(record);
  const f = fd(record, "106EF");
  const priorityTotal = sumGroup(f.priorityCreditors, "totalClaim");

  return {
    "Debtor 1": debtor1Name(record),
    "Debtor 2": debtor2Name(record),
    // Part 1 — real estate / property totals
    "1a": fmtCurrency(s.assets.realEstate),
    "1b": fmtCurrency(s.assets.vehicles),
    "1c": fmtCurrency(s.assets.personal + s.assets.financial),
    // Part 2 — liabilities
    "3a": fmtCurrency(priorityTotal),
    "3b": fmtCurrency(s.liabilities.nonpriority),
    "3c": fmtCurrency(s.liabilities.secured),
    "4": fmtCurrency(s.liabilities.grand),
    // Part 3 — summary
    "5": fmtCurrency(s.assets.grand),
    // Income
    "8": fmtCurrency(s.income.combined),
  };
}

// --- Form 122A-1: CMI ---

export function map122A1(record: CaseRecord): FieldMap {
  const r = computeMeansTest(record);
  const f = fd(record, "122A-1");
  return {
    "Debtor 1": debtor1Name(record),
    "Debtor 2": debtor2Name(record),
    "Number in household": str(f.mt1HouseholdSize),
    "state": str(f.mt1State),
    // Line items (undefined_1 through undefined_17 are the monthly income lines)
    "Copy here": fmtCurrency(r.cmiMonthly),
    "14a": r.belowMedian,
    "14b": !r.belowMedian,
  };
}

// --- Header-only forms (106C, 106G, 106H, 107, 113) ---

export function mapHeaderOnly(record: CaseRecord): FieldMap {
  return {
    "Debtor 1": debtor1Name(record),
    "Debtor 2": debtor2Name(record),
  };
}

// --- Dispatch ---

export type FormMapperKey =
  | "101" | "106AB" | "106C" | "106D" | "106EF"
  | "106G" | "106H" | "106I" | "106J" | "106Sum"
  | "107" | "113" | "122A-1";

export const FORM_PDF_FILE: Record<FormMapperKey, string> = {
  "101":    "/forms/form_b101.pdf",
  "106AB":  "/forms/form_b106ab.pdf",
  "106C":   "/forms/form_b106c.pdf",
  "106D":   "/forms/form_b106d.pdf",
  "106EF":  "/forms/form_b106ef.pdf",
  "106G":   "/forms/form_b106g.pdf",
  "106H":   "/forms/form_b106h.pdf",
  "106I":   "/forms/form_b106i.pdf",
  "106J":   "/forms/form_b106j.pdf",
  "106Sum": "/forms/form_b106sum.pdf",
  "107":    "/forms/form_b107.pdf",
  "113":    "/forms/form_b113.pdf",
  "122A-1": "/forms/form_b122a1.pdf",
};

export function buildFieldMap(formId: FormMapperKey, record: CaseRecord): FieldMap {
  switch (formId) {
    case "101":    return map101(record);
    case "106AB":  return map106AB(record);
    case "106D":   return map106D(record);
    case "106EF":  return map106EF(record);
    case "106I":   return map106I(record);
    case "106J":   return map106J(record);
    case "106Sum": return map106Sum(record);
    case "122A-1": return map122A1(record);
    default:       return mapHeaderOnly(record);
  }
}
