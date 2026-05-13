import { YES_NO } from "./common";
import type { FormSchema } from "./types";

const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Surviving spouse" },
  { value: "child", label: "Child" },
  { value: "grandchild", label: "Grandchild" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "other-relative", label: "Other relative" },
  { value: "non-relative", label: "Non-relative" },
  { value: "charity", label: "Charity" },
  { value: "trust", label: "Trust" },
];

export const eaBeneficiaries: FormSchema = {
  id: "ea-beneficiaries",
  title: "Beneficiaries",
  longTitle: "Estate Administration — Beneficiary Roster",
  appliesTo: ["estateAdmin"],
  sections: [
    {
      id: "primary",
      title: "Primary beneficiaries",
      description:
        "Every person or entity entitled to a distribution from the residuary or by intestate succession. The reconciliation engine compares these names against beneficiary designations on retirement and life insurance accounts.",
      items: [
        {
          kind: "repeating-group",
          id: "beneficiaries",
          label: "Beneficiary",
          itemLabel: "Beneficiary",
          minItems: 1,
          fields: [
            { id: "name", type: "text", label: "Full name", required: true },
            { id: "relationship", type: "select", label: "Relationship", options: RELATIONSHIP_OPTIONS },
            { id: "dob", type: "date", label: "Date of birth" },
            { id: "isMinor", type: "checkbox", label: "Minor" },
            { id: "isDisabled", type: "checkbox", label: "Incapacitated / under disability" },
            { id: "sharePercent", type: "number", label: "Share %", help: "Total of all primary shares should equal 100." },
            { id: "ssnLast4", type: "text", label: "SSN — last four" },
            { id: "email", type: "text", label: "Email" },
            { id: "phone", type: "text", label: "Phone" },
            { id: "addressStreet", type: "text", label: "Street address" },
            { id: "addressCity", type: "text", label: "City" },
            { id: "addressState", type: "text", label: "State" },
            { id: "addressZip", type: "text", label: "ZIP" },
            {
              id: "waiverStatus",
              type: "select",
              label: "Waiver / consent status",
              options: [
                { value: "not-sent", label: "Not sent" },
                { value: "sent", label: "Sent" },
                { value: "signed", label: "Signed and returned" },
                { value: "refused", label: "Refused" },
                { value: "citation-required", label: "Citation required (no waiver)" },
              ],
            },
            {
              id: "waiverDate",
              type: "date",
              label: "Date waiver signed",
            },
            { id: "predeceased", type: "checkbox", label: "Predeceased decedent" },
            {
              id: "perStirpes",
              type: "checkbox",
              label: "Per stirpes (issue take by representation)",
            },
          ],
        },
      ],
    },
    {
      id: "contingent",
      title: "Contingent beneficiaries",
      description:
        "Beneficiaries who take only if a primary fails (predeceased without issue, refusal, etc.).",
      items: [
        {
          kind: "repeating-group",
          id: "contingentBeneficiaries",
          label: "Contingent beneficiary",
          itemLabel: "Contingent",
          fields: [
            { id: "name", type: "text", label: "Full name" },
            { id: "relationship", type: "select", label: "Relationship", options: RELATIONSHIP_OPTIONS },
            { id: "conditionDescription", type: "textarea", label: "Triggering condition" },
            { id: "sharePercent", type: "number", label: "Share %" },
          ],
        },
      ],
    },
    {
      id: "guardian",
      title: "Guardian ad litem",
      items: [
        {
          id: "galRequired",
          type: "radio",
          label: "Is a guardian ad litem required?",
          options: YES_NO,
          help: "Required when there are minor or incapacitated beneficiaries with no virtual representation.",
        },
        {
          id: "galName",
          type: "text",
          label: "Guardian ad litem name",
          visibleIf: { fieldId: "galRequired", equals: "yes" },
        },
        {
          id: "galAppointmentDate",
          type: "date",
          label: "Date appointed",
          visibleIf: { fieldId: "galRequired", equals: "yes" },
        },
      ],
    },
  ],
};
