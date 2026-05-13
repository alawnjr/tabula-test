// Reconciliation engine — pure derivation of conflicts and gaps across the
// estate-admin forms. The view layer renders these with deep links so the
// attorney can jump to the offending field.

import type { CaseRecord } from "@/state/case-store";
import { eaStats } from "@/lib/derived";
import { computeDeadlines } from "./deadlines";
import { FEDERAL_706_EXEMPTION, rulesFor } from "./jurisdictions";

export type IssueSeverity = "info" | "warning" | "error";

export type ReconciliationIssue = {
  id: string;
  severity: IssueSeverity;
  formId?: string;
  fieldPath?: string;
  message: string;
  detail?: string;
};

function normalizeName(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

function listOfNames(items: unknown, key = "name"): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      return ((item as Record<string, unknown>)[key] as string | undefined) ?? "";
    })
    .filter(Boolean);
}

export function findIssues(record: CaseRecord): ReconciliationIssue[] {
  const intake = record.forms["ea-intake"] ?? {};
  const will = record.forms["ea-will"] ?? {};
  const beneficiaries = record.forms["ea-beneficiaries"] ?? {};
  const inventory = record.forms["ea-inventory"] ?? {};
  const liabilities = record.forms["ea-liabilities"] ?? {};
  const tax = record.forms["ea-tax"] ?? {};
  const stats = eaStats(record.forms);

  const issues: ReconciliationIssue[] = [];

  // 1. Date of death missing — blocks every downstream computation
  if (!stats.decedentDod) {
    issues.push({
      id: "missing-dod",
      severity: "error",
      formId: "ea-intake",
      fieldPath: "decedentDod",
      message: "Date of death is not recorded.",
      detail: "All compliance deadlines and the gross estate are computed from DOD.",
    });
  }

  // 2. Domicile state missing
  if (!stats.domicileState) {
    issues.push({
      id: "missing-domicile",
      severity: "error",
      formId: "ea-intake",
      fieldPath: "domicileState",
      message: "Domicile state at death is not recorded.",
      detail: "Domicile drives the choice of probate court and state estate tax.",
    });
  }

  // 3. Beneficiary share total
  const beneficiaryItems = Array.isArray(beneficiaries.beneficiaries)
    ? (beneficiaries.beneficiaries as unknown[])
    : [];
  const totalShare = beneficiaryItems.reduce<number>((acc, item) => {
    if (!item || typeof item !== "object") return acc;
    const pct = (item as Record<string, unknown>).sharePercent;
    return acc + (typeof pct === "number" ? pct : 0);
  }, 0);
  if (beneficiaryItems.length > 0 && Math.abs(totalShare - 100) > 0.5) {
    issues.push({
      id: "share-total",
      severity: "warning",
      formId: "ea-beneficiaries",
      fieldPath: "beneficiaries",
      message: `Primary beneficiary shares total ${totalShare.toFixed(1)}% (should be 100%).`,
      detail: "Confirm per-stirpes / residuary computation.",
    });
  }

  // 4. Beneficiary-designation conflicts (retirement / life insurance vs. will residuary)
  const willResiduaryNames = listOfNames(beneficiaries.beneficiaries, "name").map(normalizeName);
  const retirement = Array.isArray(inventory.retirementAccounts)
    ? (inventory.retirementAccounts as unknown[])
    : [];
  for (let i = 0; i < retirement.length; i++) {
    const acct = retirement[i] as Record<string, unknown> | null;
    if (!acct) continue;
    const designated = normalizeName(acct.designatedBeneficiary);
    if (!designated) continue;
    if (willResiduaryNames.length > 0 && !willResiduaryNames.some((n) => designated.includes(n) || n.includes(designated))) {
      issues.push({
        id: `retirement-mismatch-${i}`,
        severity: "warning",
        formId: "ea-inventory",
        fieldPath: `retirementAccounts/${i}/designatedBeneficiary`,
        message: `Retirement account #${i + 1} beneficiary "${acct.designatedBeneficiary}" is not on the will's residuary roster.`,
        detail: "Retirement accounts pass by designation regardless of the will. Confirm intent and document.",
      });
    }
  }
  const lifeIns = Array.isArray(inventory.lifeInsurance)
    ? (inventory.lifeInsurance as unknown[])
    : [];
  for (let i = 0; i < lifeIns.length; i++) {
    const pol = lifeIns[i] as Record<string, unknown> | null;
    if (!pol) continue;
    const designated = normalizeName(pol.designatedBeneficiary);
    if (!designated) continue;
    if (willResiduaryNames.length > 0 && !willResiduaryNames.some((n) => designated.includes(n) || n.includes(designated))) {
      issues.push({
        id: `lifeins-mismatch-${i}`,
        severity: "warning",
        formId: "ea-inventory",
        fieldPath: `lifeInsurance/${i}/designatedBeneficiary`,
        message: `Life insurance policy #${i + 1} beneficiary "${pol.designatedBeneficiary}" is not on the will's residuary roster.`,
        detail: "Insurance proceeds pass by designation. Confirm intent and document.",
      });
    }
  }

  // 5. Federal 706 likelihood vs. election status
  if (stats.grossEstate > FEDERAL_706_EXEMPTION && (tax.filing706 as string | undefined) !== "yes") {
    issues.push({
      id: "706-required",
      severity: "error",
      formId: "ea-tax",
      fieldPath: "filing706",
      message: "Gross estate exceeds federal 706 filing threshold; tax filing is not flagged.",
      detail: `Gross estate $${stats.grossEstate.toLocaleString()} exceeds the $${FEDERAL_706_EXEMPTION.toLocaleString()} threshold.`,
    });
  }

  // 6. State estate tax (NY ET-706) threshold
  if (stats.domicileState) {
    const rules = rulesFor(stats.domicileState);
    if (
      rules.stateEstateTaxFormName &&
      rules.stateEstateTaxExemption !== undefined &&
      stats.grossEstate > rules.stateEstateTaxExemption &&
      (tax.filingStateEstate as string | undefined) !== "yes"
    ) {
      issues.push({
        id: "state-estate-required",
        severity: "warning",
        formId: "ea-tax",
        fieldPath: "filingStateEstate",
        message: `Gross estate exceeds ${rules.label} estate-tax threshold; ${rules.stateEstateTaxFormName} not flagged.`,
        detail: `Gross estate $${stats.grossEstate.toLocaleString()} exceeds the ${rules.label} threshold of $${rules.stateEstateTaxExemption.toLocaleString()}.`,
      });
    }
  }

  // 7. §645 election decision past due
  if ((tax.section645Election as string | undefined) === "yes") {
    const decision = tax.section645ElectionDecisionDate as string | undefined;
    if (!decision) {
      issues.push({
        id: "645-no-decision",
        severity: "warning",
        formId: "ea-tax",
        fieldPath: "section645ElectionDecisionDate",
        message: "§645 election is flagged but no decision deadline is recorded.",
      });
    }
  }

  // 8. Letters issued but creditor notice not published (where required)
  if (stats.lettersIssuedDate && stats.domicileState) {
    const rules = rulesFor(stats.domicileState);
    if (rules.publicationRequired && (liabilities.noticePublished as string | undefined) !== "yes") {
      issues.push({
        id: "notice-not-published",
        severity: "warning",
        formId: "ea-liabilities",
        fieldPath: "noticePublished",
        message: "Letters are issued, but notice to creditors is not recorded as published.",
        detail: `${rules.label} requires publication; the creditor window starts running once it appears.`,
      });
    }
  }

  // 9. Will exists but executor not named
  if ((intake.willExists as string | undefined) === "yes" && !(intake.executorNamed as string | undefined)) {
    issues.push({
      id: "executor-undetermined",
      severity: "info",
      formId: "ea-intake",
      fieldPath: "executorNamed",
      message: "Will is recorded but executor nomination is unrecorded.",
    });
  }

  // 10. Trust + §645 implies fiscal-year election
  if (
    (will.trustExists as string | undefined) === "yes" &&
    (tax.section645Election as string | undefined) === "yes" &&
    (tax.fiscalYearElection as string | undefined) !== "fiscal"
  ) {
    issues.push({
      id: "645-needs-fiscal",
      severity: "info",
      formId: "ea-tax",
      fieldPath: "fiscalYearElection",
      message: "§645 election typically pairs with a fiscal-year election. None selected.",
    });
  }

  // 11. Surface any overdue deadlines from the calendar engine
  const todayIso = new Date().toISOString().slice(0, 10);
  for (const d of computeDeadlines(record)) {
    if (d.dueISO < todayIso && d.severity !== "info") {
      issues.push({
        id: `deadline-${d.id}`,
        severity: d.severity === "hard" ? "error" : "warning",
        message: `Deadline missed: ${d.label}.`,
        detail: `${d.basis} — was due ${d.dueISO}.`,
      });
    }
  }

  return issues;
}
