import { YES_NO } from "./common";
import type { FormSchema } from "./types";

export const eaWill: FormSchema = {
  id: "ea-will",
  title: "Will & Trust",
  longTitle: "Estate Administration — Will & Trust Instruments",
  appliesTo: ["estateAdmin"],
  sections: [
    {
      id: "will",
      title: "Will",
      items: [
        {
          id: "willStatus",
          type: "select",
          label: "Will status",
          required: true,
          options: [
            { value: "testate-original", label: "Testate — original located" },
            { value: "testate-copy", label: "Testate — only copy located" },
            { value: "intestate", label: "Intestate (no will)" },
            { value: "lost-will", label: "Lost will — copy not located" },
          ],
        },
        {
          id: "willDate",
          type: "date",
          label: "Date of execution",
        },
        {
          id: "willLocation",
          type: "text",
          label: "Original will location",
          placeholder: "Safe-deposit box / law-firm vault / surrogate filing",
        },
        {
          id: "codicilCount",
          type: "number",
          label: "Number of codicils",
        },
        {
          id: "selfProvedAffidavit",
          type: "radio",
          label: "Self-proving affidavit attached?",
          options: YES_NO,
          help: "Without it, witnesses must testify to admit the will to probate.",
        },
        {
          id: "witness1Name",
          type: "text",
          label: "Witness 1 — name",
        },
        {
          id: "witness2Name",
          type: "text",
          label: "Witness 2 — name",
        },
      ],
    },
    {
      id: "executor",
      title: "Fiduciary nominations",
      items: [
        {
          id: "executorName",
          type: "text",
          label: "Nominated executor",
        },
        {
          id: "executorRelationship",
          type: "text",
          label: "Executor relationship to decedent",
        },
        {
          id: "successorExecutorName",
          type: "text",
          label: "Successor executor",
        },
        {
          id: "trusteeName",
          type: "text",
          label: "Nominated trustee (testamentary trust)",
        },
        {
          id: "guardianName",
          type: "text",
          label: "Nominated guardian (minor children)",
        },
        {
          id: "bondWaived",
          type: "radio",
          label: "Is bond waived by the will?",
          options: YES_NO,
        },
      ],
    },
    {
      id: "specificBequests",
      title: "Specific bequests",
      description:
        "Particular items or sums named in the will. Residuary distributions go on the beneficiary roster instead.",
      items: [
        {
          kind: "repeating-group",
          id: "specificBequests",
          label: "Specific bequest",
          itemLabel: "Bequest",
          fields: [
            { id: "beneficiaryName", type: "text", label: "Beneficiary name" },
            { id: "relationship", type: "text", label: "Relationship to decedent" },
            { id: "description", type: "textarea", label: "Description of bequest", placeholder: "1969 Gibson SG, blue Volvo wagon, $10,000…" },
            { id: "estimatedValue", type: "currency", label: "Estimated value" },
            {
              id: "contingent",
              type: "checkbox",
              label: "Contingent (on a condition)",
            },
            {
              id: "lapsed",
              type: "checkbox",
              label: "Lapsed (beneficiary predeceased / item gone)",
            },
          ],
        },
      ],
    },
    {
      id: "residuary",
      title: "Residuary clause",
      items: [
        {
          id: "residuaryDescription",
          type: "textarea",
          label: "Residuary disposition (verbatim from will)",
          help: "Used by the document-generation engine to draft the petition's residuary section.",
        },
      ],
    },
    {
      id: "trust",
      title: "Trust instrument",
      items: [
        {
          id: "trustExists",
          type: "radio",
          label: "Pour-over or separate revocable trust?",
          options: YES_NO,
        },
        {
          id: "trustName",
          type: "text",
          label: "Trust name",
          visibleIf: { fieldId: "trustExists", equals: "yes" },
        },
        {
          id: "trustDate",
          type: "date",
          label: "Trust execution date",
          visibleIf: { fieldId: "trustExists", equals: "yes" },
        },
        {
          id: "section645Election",
          type: "radio",
          label: "§645 election (treat trust as part of estate for 1041)?",
          options: YES_NO,
          visibleIf: { fieldId: "trustExists", equals: "yes" },
          help: "Election is due with the first 1041 (estate's first fiscal year).",
        },
      ],
    },
  ],
};
