import { addressFields, personNameFields, US_STATES, YES_NO } from "./common";
import type { FormSchema } from "./types";

const GROSS_ESTATE_BANDS = [
  { value: "under-1m", label: "Under $1M" },
  { value: "1m-5m", label: "$1M – $5M" },
  { value: "5m-13m", label: "$5M – $13M" },
  { value: "over-13m", label: "Over $13M (likely federal 706)" },
  { value: "unknown", label: "Unknown" },
];

export const eaIntake: FormSchema = {
  id: "ea-intake",
  title: "Case Intake",
  longTitle: "Estate Administration — Case Blueprint",
  appliesTo: ["estateAdmin"],
  sections: [
    {
      id: "decedent",
      title: "Decedent",
      description:
        "Basic identity and date of death. Most deadlines are computed from the DOD + domicile, so accuracy here drives the calendar.",
      items: [
        ...personNameFields("clientName", "Decedent name"),
        { id: "decedentDob", type: "date", label: "Date of birth" },
        { id: "decedentDod", type: "date", label: "Date of death", required: true },
        { id: "decedentSsnLast4", type: "text", label: "SSN — last four", placeholder: "1234" },
        {
          id: "domicileState",
          type: "select",
          label: "Domicile state at death",
          required: true,
          options: US_STATES,
          help: "Drives jurisdiction-specific deadlines and required filings.",
        },
        ...addressFields("decedentAddress"),
      ],
    },
    {
      id: "will",
      title: "Will & instrument",
      items: [
        {
          id: "willExists",
          type: "radio",
          label: "Does a will exist?",
          required: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No (intestate)" },
            { value: "unknown", label: "Unknown" },
          ],
        },
        {
          id: "willDate",
          type: "date",
          label: "Date of the will",
          visibleIf: { fieldId: "willExists", equals: "yes" },
        },
        {
          id: "willLocation",
          type: "text",
          label: "Original will located where?",
          visibleIf: { fieldId: "willExists", equals: "yes" },
          placeholder: "Safe-deposit box / law firm vault / surrogate's office",
        },
        {
          id: "executorNamed",
          type: "radio",
          label: "Executor nominated in will?",
          options: YES_NO,
          visibleIf: { fieldId: "willExists", equals: "yes" },
        },
        {
          id: "executorName",
          type: "text",
          label: "Nominated executor — name",
          visibleIf: { fieldId: "executorNamed", equals: "yes" },
        },
        {
          id: "trustExists",
          type: "radio",
          label: "Pour-over or separate revocable trust?",
          options: YES_NO,
        },
      ],
    },
    {
      id: "family",
      title: "Family",
      items: [
        {
          id: "survivingSpouse",
          type: "radio",
          label: "Surviving spouse?",
          required: true,
          options: YES_NO,
        },
        {
          id: "spouseName",
          type: "text",
          label: "Spouse name",
          visibleIf: { fieldId: "survivingSpouse", equals: "yes" },
        },
        {
          id: "minorChildren",
          type: "radio",
          label: "Any minor or disabled beneficiaries?",
          options: YES_NO,
          help: "Triggers guardian ad litem / infant compromise considerations.",
        },
        {
          id: "estimatedBeneficiaryCount",
          type: "number",
          label: "Approximate number of beneficiaries",
        },
      ],
    },
    {
      id: "estateProfile",
      title: "Estate profile",
      description:
        "Rough magnitudes used to flag federal 706 likelihood and to surface jurisdictional triggers. Refined later from the inventory.",
      items: [
        {
          id: "grossEstateBand",
          type: "select",
          label: "Estimated gross estate",
          options: GROSS_ESTATE_BANDS,
        },
        {
          id: "outOfStateRealProperty",
          type: "radio",
          label: "Real property in any state other than domicile?",
          options: YES_NO,
          help: "Triggers ancillary administration.",
        },
        {
          id: "businessInterests",
          type: "radio",
          label: "Any closely-held business interests?",
          options: YES_NO,
        },
        {
          id: "lifeInsurance",
          type: "radio",
          label: "Life insurance on the decedent?",
          options: YES_NO,
        },
        {
          id: "retirementAccounts",
          type: "radio",
          label: "Retirement accounts with named beneficiaries?",
          options: YES_NO,
          help: "Non-probate but in the federal gross estate; verify beneficiary designations.",
        },
        {
          id: "priorGifts",
          type: "radio",
          label: "Significant lifetime gifts (Forms 709 filed)?",
          options: YES_NO,
        },
      ],
    },
    {
      id: "filing",
      title: "Filing status",
      items: [
        {
          id: "letterStatus",
          type: "select",
          label: "Letters testamentary / of administration status",
          options: [
            { value: "not-filed", label: "Not yet filed" },
            { value: "filed", label: "Petition filed" },
            { value: "issued", label: "Letters issued" },
          ],
        },
        {
          id: "lettersIssuedDate",
          type: "date",
          label: "Date letters issued",
          visibleIf: { fieldId: "letterStatus", equals: "issued" },
          help: "Creditor window and accounting deadlines run from this date in most jurisdictions.",
        },
      ],
    },
  ],
};
