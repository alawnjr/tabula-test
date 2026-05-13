import { YES_NO } from "./common";
import type { FormSchema } from "./types";

const DEBT_KIND_OPTIONS = [
  { value: "mortgage", label: "Mortgage / HELOC" },
  { value: "credit-card", label: "Credit card" },
  { value: "auto-loan", label: "Auto loan" },
  { value: "medical", label: "Medical / nursing-home" },
  { value: "personal-loan", label: "Personal loan" },
  { value: "tax", label: "Tax liability" },
  { value: "utility", label: "Final utilities" },
  { value: "professional", label: "Professional fees" },
  { value: "other", label: "Other" },
];

const CLAIM_STATUS_OPTIONS = [
  { value: "open", label: "Open — within creditor window" },
  { value: "paid", label: "Paid" },
  { value: "disputed", label: "Disputed" },
  { value: "rejected", label: "Rejected by fiduciary" },
  { value: "litigated", label: "In litigation" },
  { value: "time-barred", label: "Time-barred (creditor window closed)" },
];

export const eaLiabilities: FormSchema = {
  id: "ea-liabilities",
  title: "Debts & Claims",
  longTitle: "Estate Administration — Debts & Creditor Claims",
  appliesTo: ["estateAdmin"],
  sections: [
    {
      id: "knownDebts",
      title: "Known debts",
      description:
        "Liabilities identified by the fiduciary during inventory. Bring these into the formal claims list once creditor notice is published.",
      items: [
        {
          kind: "repeating-group",
          id: "knownDebts",
          label: "Known debt",
          itemLabel: "Debt",
          fields: [
            { id: "creditor", type: "text", label: "Creditor" },
            { id: "kind", type: "select", label: "Kind", options: DEBT_KIND_OPTIONS },
            { id: "lastFour", type: "text", label: "Account last four" },
            { id: "amount", type: "currency", label: "Balance at DOD" },
            { id: "incurredDate", type: "date", label: "Date incurred" },
            { id: "secured", type: "checkbox", label: "Secured" },
            { id: "collateralDescription", type: "text", label: "Collateral (if secured)" },
            {
              id: "noticeSent",
              type: "radio",
              label: "Formal notice to creditor sent?",
              options: YES_NO,
            },
            { id: "noticeSentDate", type: "date", label: "Notice sent date" },
          ],
        },
      ],
    },
    {
      id: "creditorClaims",
      title: "Filed creditor claims",
      description:
        "Claims actually filed against the estate after publication of notice. Tracked separately so the accounting can show payment status.",
      items: [
        {
          kind: "repeating-group",
          id: "creditorClaims",
          label: "Filed claim",
          itemLabel: "Claim",
          fields: [
            { id: "claimant", type: "text", label: "Claimant" },
            { id: "claimedAmount", type: "currency", label: "Claimed amount" },
            { id: "filedDate", type: "date", label: "Date filed" },
            { id: "status", type: "select", label: "Status", options: CLAIM_STATUS_OPTIONS },
            { id: "paidAmount", type: "currency", label: "Amount paid" },
            { id: "paidDate", type: "date", label: "Date paid" },
            { id: "notes", type: "textarea", label: "Notes / supporting docs" },
          ],
        },
      ],
    },
    {
      id: "administrationExpenses",
      title: "Administration expenses",
      description:
        "Costs of administering the estate — funeral, attorney fees, fiduciary commissions. These are deductible on Form 706 (federal) and most state estate-tax returns.",
      items: [
        { id: "funeralExpenses", type: "currency", label: "Funeral & burial expenses" },
        { id: "lastIllnessExpenses", type: "currency", label: "Last-illness expenses" },
        { id: "fiduciaryCommissions", type: "currency", label: "Fiduciary commissions (estimated)" },
        { id: "attorneyFees", type: "currency", label: "Attorney fees (estimated)" },
        { id: "accountantFees", type: "currency", label: "Accountant fees (estimated)" },
        { id: "courtFees", type: "currency", label: "Court / filing fees" },
        { id: "otherAdminExpenses", type: "currency", label: "Other administration expenses" },
      ],
    },
    {
      id: "creditorNotice",
      title: "Notice to creditors",
      description:
        "In NY, publication runs in a newspaper of general circulation and the creditor window is generally seven months from issuance of letters.",
      items: [
        {
          id: "noticePublished",
          type: "radio",
          label: "Notice to creditors published?",
          options: YES_NO,
        },
        {
          id: "publicationDate",
          type: "date",
          label: "First publication date",
          visibleIf: { fieldId: "noticePublished", equals: "yes" },
        },
        {
          id: "newspaper",
          type: "text",
          label: "Newspaper / publication",
          visibleIf: { fieldId: "noticePublished", equals: "yes" },
        },
        {
          id: "creditorWindowClosesDate",
          type: "date",
          label: "Creditor window closes",
          help: "NY: 7 months from issuance of letters. Many other states: from first publication.",
        },
      ],
    },
  ],
};
