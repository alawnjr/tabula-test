import { YES_NO } from "./common";
import type { FormSchema } from "./types";

export const reContractNy: FormSchema = {
  id: "re-contract-ny",
  title: "NY Contract of Sale",
  longTitle: "New York Contract of Sale — Disclosures & Co-op/Condo Terms",
  appliesTo: ["realEstate"],
  sections: [
    {
      id: "pcds",
      title: "Property Condition Disclosure Statement (PCDS)",
      description:
        "NY RPL §462 (amended 3/20/2024): PCDS is now mandatory for covered transactions. The $500 credit opt-out was eliminated. Seller must complete and deliver before buyer signs a binding contract. Use the current form (updated 7/1/2025 to include septic questions).",
      items: [
        {
          id: "pcdsRequired",
          type: "radio",
          label: "Is this a covered transaction requiring PCDS under RPL §462?",
          required: true,
          options: YES_NO,
        },
        {
          id: "pcdsProvided",
          type: "radio",
          label: "PCDS provided to buyer before contract signing?",
          options: YES_NO,
          visibleIf: { fieldId: "pcdsRequired", equals: "yes" },
        },
        {
          id: "pcdsDate",
          type: "date",
          label: "Date PCDS delivered",
          visibleIf: { fieldId: "pcdsProvided", equals: "yes" },
        },
        {
          id: "pcdsDefects",
          type: "textarea",
          label: "Material defects / conditions disclosed",
          placeholder: "List any conditions seller disclosed on the PCDS",
          visibleIf: { fieldId: "pcdsProvided", equals: "yes" },
        },
        {
          id: "pcdsFloodDisclosure",
          type: "radio",
          label: "Flood-related disclosures included (required by 2024 amendment)?",
          options: YES_NO,
          visibleIf: { fieldId: "pcdsProvided", equals: "yes" },
        },
      ],
    },
    {
      id: "disclosures",
      title: "Required NY disclosures",
      items: [
        {
          id: "pre1978Property",
          type: "radio",
          label: "Pre-1978 property (lead paint disclosure required)?",
          options: YES_NO,
        },
        {
          id: "leadPaintDisclosureProvided",
          type: "radio",
          label: "EPA lead paint disclosure and pamphlet provided?",
          options: YES_NO,
          visibleIf: { fieldId: "pre1978Property", equals: "yes" },
        },
        {
          id: "smokeCoAffidavitRequired",
          type: "radio",
          label: "Smoke / CO detector affidavit required? (NY Executive Law §378(5))",
          help: "Required for 1-2 family homes, co-ops, and condos",
          options: YES_NO,
        },
        {
          id: "smokeCoAffidavitSigned",
          type: "radio",
          label: "Smoke / CO detector affidavit signed and notarized by both parties?",
          options: YES_NO,
          visibleIf: { fieldId: "smokeCoAffidavitRequired", equals: "yes" },
        },
        {
          id: "todDeed",
          type: "radio",
          label: "Transfer on Death Deed (TODD) involved? (NY RPL §424, effective 7/19/2024)",
          options: YES_NO,
        },
      ],
    },
    {
      id: "contractTerms",
      title: "NY contract terms",
      description:
        "In NY, attorneys draft the formal Contract of Sale. The process: seller's attorney sends draft → buyer signs with down payment → seller countersigns (\"going to contract\").",
      items: [
        {
          id: "contractSentDate",
          type: "date",
          label: "Contract draft sent to buyer's attorney",
        },
        {
          id: "buyerSignedDate",
          type: "date",
          label: "Contract signed by buyer (with down payment)",
        },
        {
          id: "goingToContractDate",
          type: "date",
          label: "Contract fully executed (\"going to contract\") date",
        },
        {
          id: "downPaymentPercent",
          type: "number",
          label: "Down payment percentage (typically 10% in NY)",
          placeholder: "10",
        },
        {
          id: "downPaymentAmount",
          type: "currency",
          label: "Down payment amount held in escrow",
        },
        {
          id: "downPaymentHeldBy",
          type: "text",
          label: "Down payment held by (seller's attorney / title company)",
        },
        {
          id: "mortgageContingencyRate",
          type: "number",
          label: "Mortgage contingency — maximum interest rate (%)",
        },
        {
          id: "mortgageContingencyAmount",
          type: "currency",
          label: "Mortgage contingency — loan amount",
        },
        {
          id: "mortgageContingencyDeadline",
          type: "date",
          label: "Mortgage contingency commitment deadline",
        },
      ],
    },
    {
      id: "coopCondo",
      title: "Co-op / Condo — board approval",
      description:
        "NYC co-op purchases require board approval. Condos have a right of first refusal (ROFR) which boards can exercise. These deadlines are typically written into the contract.",
      items: [
        {
          id: "boardApprovalRequired",
          type: "radio",
          label: "Board approval required (co-op purchase or condo ROFR)?",
          options: YES_NO,
        },
        {
          id: "boardApplicationSubmitted",
          type: "radio",
          label: "Board package / application submitted?",
          options: YES_NO,
          visibleIf: { fieldId: "boardApprovalRequired", equals: "yes" },
        },
        {
          id: "boardApplicationDate",
          type: "date",
          label: "Board application submission date",
          visibleIf: { fieldId: "boardApplicationSubmitted", equals: "yes" },
        },
        {
          id: "boardInterviewDate",
          type: "date",
          label: "Board interview date (co-op)",
          visibleIf: { fieldId: "boardApprovalRequired", equals: "yes" },
        },
        {
          id: "boardApprovalStatus",
          type: "select",
          label: "Board approval status",
          options: [
            { value: "pending", label: "Pending" },
            { value: "interview-scheduled", label: "Interview scheduled" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
            { value: "waived", label: "ROFR waived (condo)" },
          ],
          visibleIf: { fieldId: "boardApprovalRequired", equals: "yes" },
        },
        {
          id: "flipTaxApplies",
          type: "radio",
          label: "Flip tax applies?",
          options: YES_NO,
        },
        {
          id: "flipTaxAmount",
          type: "currency",
          label: "Flip tax amount",
          visibleIf: { fieldId: "flipTaxApplies", equals: "yes" },
        },
        {
          id: "flipTaxPaidBy",
          type: "select",
          label: "Flip tax paid by",
          options: [
            { value: "seller", label: "Seller" },
            { value: "buyer", label: "Buyer" },
            { value: "split", label: "Split" },
          ],
          visibleIf: { fieldId: "flipTaxApplies", equals: "yes" },
        },
      ],
    },
  ],
};
