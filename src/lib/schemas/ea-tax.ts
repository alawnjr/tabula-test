import { YES_NO } from "./common";
import type { FormSchema } from "./types";

export const eaTax: FormSchema = {
  id: "ea-tax",
  title: "Tax Coordination",
  longTitle: "Estate Administration — Tax Elections & Coordination",
  appliesTo: ["estateAdmin"],
  sections: [
    {
      id: "cpa",
      title: "Tax preparer",
      items: [
        { id: "cpaName", type: "text", label: "CPA / firm name" },
        { id: "cpaEmail", type: "text", label: "CPA email" },
        { id: "cpaPhone", type: "text", label: "CPA phone" },
        { id: "ein", type: "text", label: "Estate EIN (Form SS-4)" },
        { id: "einApplied", type: "date", label: "Date EIN obtained" },
      ],
    },
    {
      id: "elections",
      title: "Key elections",
      description:
        "Most of these have a window keyed to the first 1041 filing or the 706 due date. Decisions need attorney + CPA sign-off; once filed they are generally irrevocable.",
      items: [
        {
          id: "fiscalYearElection",
          type: "radio",
          label: "Fiscal-year vs. calendar-year for the estate?",
          options: [
            { value: "calendar", label: "Calendar year" },
            { value: "fiscal", label: "Fiscal year" },
            { value: "undecided", label: "Undecided" },
          ],
          help: "Fiscal year can defer income one year and is often advantageous.",
        },
        {
          id: "fiscalYearEndDate",
          type: "date",
          label: "Selected fiscal-year end",
          visibleIf: { fieldId: "fiscalYearElection", equals: "fiscal" },
        },
        {
          id: "section645Election",
          type: "radio",
          label: "§645 election (combine revocable trust with estate for 1041)?",
          options: YES_NO,
          help: "Due with the first 1041. Allows trust to use fiscal year and unified administration.",
        },
        {
          id: "section645ElectionDecisionDate",
          type: "date",
          label: "§645 decision deadline",
          visibleIf: { fieldId: "section645Election", equals: "yes" },
        },
        {
          id: "qtipElection",
          type: "radio",
          label: "QTIP election on 706 (marital deduction)?",
          options: YES_NO,
        },
        {
          id: "alternateValuationElection",
          type: "radio",
          label: "Alternate valuation date election (706)?",
          options: YES_NO,
          help: "Available when alternate value reduces both gross estate and tax owed.",
        },
        {
          id: "portabilityElection",
          type: "radio",
          label: "Portability of DSUE election (706, surviving spouse)?",
          options: YES_NO,
        },
      ],
    },
    {
      id: "returns",
      title: "Returns to file",
      items: [
        {
          id: "filing706",
          type: "radio",
          label: "Federal Form 706 (estate tax) required?",
          options: YES_NO,
          help: "Required if gross estate plus adjusted taxable gifts exceeds federal filing threshold; or to elect portability.",
        },
        {
          id: "filing1041",
          type: "radio",
          label: "Federal Form 1041 (income tax) required?",
          options: YES_NO,
          help: "Required if estate has $600+ gross income in a taxable year.",
        },
        {
          id: "filingStateEstate",
          type: "radio",
          label: "State estate-tax return required?",
          options: YES_NO,
          help: "NY ET-706 has a much lower threshold than federal.",
        },
        {
          id: "filingStateName",
          type: "text",
          label: "State return name",
          visibleIf: { fieldId: "filingStateEstate", equals: "yes" },
          placeholder: "NY ET-706",
        },
        {
          id: "filing1040Final",
          type: "radio",
          label: "Final 1040 (decedent) coordinated with CPA?",
          options: YES_NO,
        },
      ],
    },
    {
      id: "estimatedPayments",
      title: "Estimated tax payments during administration",
      items: [
        {
          kind: "repeating-group",
          id: "estimatedPayments",
          label: "Estimated payment",
          itemLabel: "Payment",
          fields: [
            { id: "taxYear", type: "text", label: "Tax year" },
            {
              id: "kind",
              type: "select",
              label: "Type",
              options: [
                { value: "federal-1041", label: "Federal 1041" },
                { value: "state-fiduciary", label: "State fiduciary" },
                { value: "final-1040", label: "Decedent's final 1040" },
              ],
            },
            { id: "paymentDate", type: "date", label: "Payment date" },
            { id: "amount", type: "currency", label: "Amount" },
            { id: "confirmation", type: "text", label: "Confirmation / EFTPS reference" },
          ],
        },
      ],
    },
  ],
};
