import { YES_NO } from "./common";
import type { FormSchema } from "./types";

export const piRetainerNy: FormSchema = {
  id: "pi-retainer-ny",
  title: "Retainer & Fees",
  longTitle: "NY Personal Injury — Retainer Agreement & Fee Calculation",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "retainerAgreement",
      title: "Retainer agreement",
      description:
        "NY Rules of Professional Conduct Rule 1.5(c) requires a written contingency fee agreement signed by the client. The agreement must state the method of calculating the fee and how expenses are handled.",
      items: [
        {
          id: "retainerSigned",
          type: "radio",
          label: "Retainer agreement signed by client?",
          required: true,
          options: YES_NO,
        },
        {
          id: "retainerSignedDate",
          type: "date",
          label: "Date retainer signed",
          visibleIf: { fieldId: "retainerSigned", equals: "yes" },
        },
        {
          id: "retainerType",
          type: "select",
          label: "Fee arrangement",
          options: [
            { value: "contingency-sliding", label: "Contingency — NY sliding scale (22 NYCRR §691.20)" },
            { value: "contingency-flat", label: "Contingency — flat one-third (contractual)" },
            { value: "hourly", label: "Hourly" },
            { value: "hybrid", label: "Hybrid (hourly + contingency)" },
          ],
          visibleIf: { fieldId: "retainerSigned", equals: "yes" },
        },
        {
          id: "retainerNotes",
          type: "textarea",
          label: "Fee agreement notes / special terms",
          visibleIf: { fieldId: "retainerSigned", equals: "yes" },
        },
        {
          id: "clientCopyProvided",
          type: "radio",
          label: "Copy of signed retainer provided to client?",
          options: YES_NO,
          visibleIf: { fieldId: "retainerSigned", equals: "yes" },
        },
        {
          id: "costRecoveryMethod",
          type: "select",
          label: "Disbursements / costs deducted",
          help: "Determines whether attorney's percentage is taken before or after costs are subtracted",
          options: [
            { value: "before-fee", label: "Costs deducted before fee calculation" },
            { value: "after-fee", label: "Costs deducted after fee calculation" },
          ],
          visibleIf: { fieldId: "retainerSigned", equals: "yes" },
        },
        {
          id: "costsAdvanced",
          type: "currency",
          label: "Costs advanced by firm to date",
          visibleIf: { fieldId: "retainerSigned", equals: "yes" },
        },
      ],
    },
    {
      id: "nyFeeScale",
      title: "NY sliding-scale fee calculator",
      description:
        "22 NYCRR §691.20 sets the mandatory sliding scale for personal injury / wrongful death contingency fees: 1/3 of first $250,000 recovered; 25% of next $250,000; 20% of next $500,000; 15% of next $250,000; 10% of anything over $1,250,000. Enter the gross recovery to calculate attorney's fee and net client proceeds.",
      items: [
        {
          id: "grossRecovery",
          type: "currency",
          label: "Gross recovery (settlement or verdict)",
        },
        {
          id: "tier1Fee",
          type: "currency",
          label: "Tier 1 fee — 1/3 of first $250,000",
          help: "Maximum $83,333",
        },
        {
          id: "tier2Fee",
          type: "currency",
          label: "Tier 2 fee — 25% of next $250,000",
          help: "On amounts $250,001–$500,000; maximum $62,500",
        },
        {
          id: "tier3Fee",
          type: "currency",
          label: "Tier 3 fee — 20% of next $500,000",
          help: "On amounts $500,001–$1,000,000; maximum $100,000",
        },
        {
          id: "tier4Fee",
          type: "currency",
          label: "Tier 4 fee — 15% of next $250,000",
          help: "On amounts $1,000,001–$1,250,000; maximum $37,500",
        },
        {
          id: "tier5Fee",
          type: "currency",
          label: "Tier 5 fee — 10% over $1,250,000",
        },
        {
          id: "totalAttorneyFee",
          type: "currency",
          label: "Total attorney's fee",
        },
        {
          id: "totalCostsDeducted",
          type: "currency",
          label: "Total costs / disbursements deducted",
        },
        {
          id: "netClientRecovery",
          type: "currency",
          label: "Net client recovery",
        },
        {
          id: "feeStatementProvided",
          type: "radio",
          label: "Written fee statement provided to client at settlement?",
          help: "Required by 22 NYCRR §691.20 — must itemize fee, costs, and net recovery",
          options: YES_NO,
        },
      ],
    },
    {
      id: "infantCompromise",
      title: "Infant / incapacitated person — court approval",
      description:
        "CPLR §§1207–1208: settlements on behalf of an infant (under 18) or judicially declared incompetent require court approval by petition to Supreme Court. Net proceeds must be deposited in a restricted account.",
      items: [
        {
          id: "infantPlaintiff",
          type: "radio",
          label: "Is the plaintiff an infant or incapacitated person?",
          options: YES_NO,
        },
        {
          id: "infantCompromisePetitionFiled",
          type: "radio",
          label: "Infant compromise order petition filed?",
          options: YES_NO,
          visibleIf: { fieldId: "infantPlaintiff", equals: "yes" },
        },
        {
          id: "infantCompromisePetitionDate",
          type: "date",
          label: "Petition filing date",
          visibleIf: { fieldId: "infantCompromisePetitionFiled", equals: "yes" },
        },
        {
          id: "infantCompromiseOrderSigned",
          type: "radio",
          label: "Court order approving settlement signed?",
          options: YES_NO,
          visibleIf: { fieldId: "infantPlaintiff", equals: "yes" },
        },
        {
          id: "infantCompromiseOrderDate",
          type: "date",
          label: "Order date",
          visibleIf: { fieldId: "infantCompromiseOrderSigned", equals: "yes" },
        },
        {
          id: "infantFundsDeposited",
          type: "radio",
          label: "Net proceeds deposited in restricted / structured account?",
          options: YES_NO,
          visibleIf: { fieldId: "infantCompromiseOrderSigned", equals: "yes" },
        },
      ],
    },
  ],
};
