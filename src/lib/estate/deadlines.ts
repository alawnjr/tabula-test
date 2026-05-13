// Pure derivation of the estate-administration compliance calendar from
// a CaseRecord. Inputs: DOD, domicile state, letters issuance date, asset
// flags. Output: an ordered Deadline[] with dependency arrows.

import type { CaseRecord } from "@/state/case-store";
import { eaStats } from "@/lib/derived";
import { rulesFor } from "./jurisdictions";

export type DeadlineKind =
  | "federal-706"
  | "federal-1041"
  | "state-estate"
  | "decedent-1040"
  | "creditor-window"
  | "accounting"
  | "section-645"
  | "ein"
  | "death-cert"
  | "letters";

export type DeadlineSeverity = "info" | "soft" | "hard";

export type Deadline = {
  id: string;
  label: string;
  dueISO: string;
  basis: string;
  jurisdiction: "federal" | "state";
  kind: DeadlineKind;
  severity: DeadlineSeverity;
  dependsOn?: string[]; // ids of upstream deadlines
};

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nextApril15(iso: string): string {
  const d = new Date(iso);
  const year = d.getUTCFullYear() + 1;
  return `${year}-04-15`;
}

export function computeDeadlines(record: CaseRecord): Deadline[] {
  const tax = record.forms["ea-tax"] ?? {};
  const liabilities = record.forms["ea-liabilities"] ?? {};
  const stats = eaStats(record.forms);

  const dod = stats.decedentDod;
  const lettersIssued = stats.lettersIssuedDate;
  const domicile = stats.domicileState;
  const rules = rulesFor(domicile);

  const out: Deadline[] = [];

  if (!dod) return out;

  // Universal: certified death certificates (informational, not statutory)
  out.push({
    id: "death-cert",
    label: "Order certified death certificates",
    dueISO: addDays(dod, 14),
    basis: "Practical — needed to retitle every asset.",
    jurisdiction: "state",
    kind: "death-cert",
    severity: "info",
  });

  // Letters testamentary / of administration — soft target
  if (!lettersIssued) {
    out.push({
      id: "letters",
      label: "Petition for letters",
      dueISO: addMonths(dod, 1),
      basis: "Soft target — most courts expect the petition within ~30 days.",
      jurisdiction: "state",
      kind: "letters",
      severity: "soft",
    });
  }

  // EIN: needed for any estate that will file 1041 or open accounts
  out.push({
    id: "ein",
    label: "Obtain estate EIN (Form SS-4)",
    dueISO: addDays(dod, 30),
    basis: "Needed to open the estate account; required if a 1041 will be filed.",
    jurisdiction: "federal",
    kind: "ein",
    severity: "info",
  });

  // Federal 706: due 9 months from DOD
  const filing706 = (tax.filing706 as string | undefined) === "yes";
  if (filing706) {
    out.push({
      id: "federal-706",
      label: "File Federal Form 706 (estate tax return)",
      dueISO: addMonths(dod, 9),
      basis: "IRC §6075 — 9 months from date of death (6-month automatic extension on Form 4768).",
      jurisdiction: "federal",
      kind: "federal-706",
      severity: "hard",
    });
  }

  // State estate-tax return (NY ET-706 etc.)
  const filingState = (tax.filingStateEstate as string | undefined) === "yes";
  if (filingState && rules.stateEstateTaxFormName) {
    out.push({
      id: "state-estate",
      label: `File ${rules.stateEstateTaxFormName}`,
      dueISO: addMonths(dod, 9),
      basis: `${rules.label} state estate tax — due 9 months from DOD (common to align with federal 706).`,
      jurisdiction: "state",
      kind: "state-estate",
      severity: "hard",
    });
  }

  // Decedent's final 1040 — due April 15 of the year after DOD
  out.push({
    id: "decedent-1040",
    label: "File decedent's final Form 1040",
    dueISO: nextApril15(dod),
    basis: "IRC §6072 — final 1040 due on the normal individual deadline of the year following death.",
    jurisdiction: "federal",
    kind: "decedent-1040",
    severity: "hard",
  });

  // Creditor window — runs from letters issuance (in NY) or publication
  if (lettersIssued && rules.creditorWindowDaysFromLetters) {
    out.push({
      id: "creditor-window",
      label: "Creditor claim window closes",
      dueISO: addDays(lettersIssued, rules.creditorWindowDaysFromLetters),
      basis: `${rules.label} — ${rules.creditorWindowDaysFromLetters / 30} months from issuance of letters.`,
      jurisdiction: "state",
      kind: "creditor-window",
      severity: "hard",
      dependsOn: ["letters"],
    });
  } else if (rules.creditorWindowDaysFromPublication) {
    const pubDate = liabilities.publicationDate as string | undefined;
    if (pubDate) {
      out.push({
        id: "creditor-window",
        label: "Creditor claim window closes",
        dueISO: addDays(pubDate, rules.creditorWindowDaysFromPublication),
        basis: `${rules.label} — runs from first publication of notice.`,
        jurisdiction: "state",
        kind: "creditor-window",
        severity: "hard",
      });
    }
  }

  // First accounting — depends on creditor-window having closed in most states
  if (lettersIssued && rules.firstAccountingDaysFromLetters) {
    out.push({
      id: "accounting",
      label: "File first accounting",
      dueISO: addDays(lettersIssued, rules.firstAccountingDaysFromLetters),
      basis: `${rules.label} — first accounting due ${rules.firstAccountingDaysFromLetters} days from letters.`,
      jurisdiction: "state",
      kind: "accounting",
      severity: "hard",
      dependsOn: ["creditor-window"],
    });
  }

  // §645 election deadline — due with first 1041
  const section645 = (tax.section645Election as string | undefined) === "yes";
  if (section645) {
    out.push({
      id: "section-645",
      label: "Make §645 election (with first 1041)",
      dueISO: addMonths(dod, 12), // approx — actual rule keys to fiscal-year end + extensions
      basis: "Treas. Reg. §1.645-1 — election is due with the first 1041 of the combined entity.",
      jurisdiction: "federal",
      kind: "section-645",
      severity: "hard",
    });
  }

  return out.sort((a, b) => (a.dueISO < b.dueISO ? -1 : 1));
}

export function bucketize(
  deadlines: Deadline[],
  nowISO = new Date().toISOString().slice(0, 10)
): {
  overdue: Deadline[];
  thisMonth: Deadline[];
  upcoming: Deadline[];
} {
  const overdue: Deadline[] = [];
  const thisMonth: Deadline[] = [];
  const upcoming: Deadline[] = [];
  const today = new Date(nowISO);
  const monthEnd = new Date(today);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const monthEndISO = monthEnd.toISOString().slice(0, 10);
  for (const d of deadlines) {
    if (d.dueISO < nowISO) overdue.push(d);
    else if (d.dueISO < monthEndISO) thisMonth.push(d);
    else upcoming.push(d);
  }
  return { overdue, thisMonth, upcoming };
}
