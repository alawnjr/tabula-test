import type { FormSchema } from "./types";

export const schedule106C: FormSchema = {
  id: "106C",
  title: "Schedule C — Exemptions",
  longTitle: "Schedule C — The Property You Claim as Exempt",
  appliesTo: ["chapter7", "chapter13"],
  sections: [
    {
      id: "scheme",
      title: "Exemption scheme",
      items: [
        {
          id: "exemptionScheme",
          type: "radio",
          label:
            "Which set of exemptions are you claiming? You may claim only one set.",
          options: [
            { value: "state", label: "State and federal nonbankruptcy exemptions" },
            { value: "federal", label: "Federal exemptions under 11 U.S.C. § 522(d)" },
          ],
          required: true,
        },
        {
          id: "homesteadOver170Months",
          type: "radio",
          label:
            "Are you claiming a homestead exemption above $189,050 (cap for property acquired within 1,215 days)?",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
        },
      ],
    },
    {
      id: "exemptions",
      title: "Property claimed as exempt",
      description:
        "List each piece of property you claim as exempt and the law that allows the exemption.",
      items: [
        {
          kind: "repeating-group",
          id: "exemptions",
          label: "Exemptions",
          itemLabel: "Exemption",
          fields: [
            {
              id: "propertyDescription",
              type: "text",
              label: "Brief description of property (mirror Schedule A/B)",
            },
            {
              id: "scheduleAbLine",
              type: "text",
              label: "Line from Schedule A/B (e.g., 1.1, 3.2)",
            },
            { id: "currentValue", type: "currency", label: "Current value of the property" },
            {
              id: "exemptionType",
              type: "radio",
              label: "Amount you claim as exempt",
              options: [
                { value: "specificAmount", label: "A specific dollar amount" },
                { value: "fullFmv", label: "100% of fair market value (up to applicable statutory limit)" },
              ],
            },
            {
              id: "exemptAmount",
              type: "currency",
              label: "Exempt amount",
              visibleIf: { fieldId: "exemptionType", equals: "specificAmount" },
            },
            {
              id: "lawCitation",
              type: "text",
              label: "Specific law that allows the exemption (e.g., 11 U.S.C. § 522(d)(1))",
            },
          ],
        },
      ],
    },
  ],
};
