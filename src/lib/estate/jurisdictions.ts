// Jurisdictional rules table for estate administration.
// Keyed by US state code. NY is fully populated; others fall back to the
// generic federal rules + a marker that state-specific deadlines are unknown.

export type JurisdictionRules = {
  stateCode: string;
  label: string;
  // Days from issuance of letters until the creditor claim window closes.
  // Some states run from first publication instead — that's a different rule.
  creditorWindowDaysFromLetters?: number;
  creditorWindowDaysFromPublication?: number;
  // Days from issuance of letters until the first accounting is due.
  firstAccountingDaysFromLetters?: number;
  // State estate-tax return name and threshold (rough; for surfacing only,
  // not for legal compliance).
  stateEstateTaxFormName?: string;
  stateEstateTaxExemption?: number;
  // Publication of notice to creditors required?
  publicationRequired: boolean;
};

export const NY_RULES: JurisdictionRules = {
  stateCode: "NY",
  label: "New York",
  creditorWindowDaysFromLetters: 7 * 30, // 7 months
  firstAccountingDaysFromLetters: 365,
  stateEstateTaxFormName: "NY ET-706",
  // The NY exemption has tracked with inflation; this is the 2024 figure for surfacing.
  stateEstateTaxExemption: 6_940_000,
  publicationRequired: true,
};

export const GENERIC_RULES: JurisdictionRules = {
  stateCode: "",
  label: "Generic",
  publicationRequired: true,
};

const TABLE: Record<string, JurisdictionRules> = {
  NY: NY_RULES,
};

export function rulesFor(stateCode: string | null | undefined): JurisdictionRules {
  if (!stateCode) return GENERIC_RULES;
  return TABLE[stateCode] ?? GENERIC_RULES;
}

// Federal estate-tax filing threshold (2024 — for surfacing only, refresh each year).
export const FEDERAL_706_EXEMPTION = 13_610_000;
