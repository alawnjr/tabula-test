import { addressFields, US_STATES } from "./common";
import type { FormSchema } from "./types";

export const schedule106H: FormSchema = {
  id: "106H",
  title: "Schedule H — Codebtors",
  longTitle: "Schedule H — Your Codebtors",
  appliesTo: ["chapter7", "chapter13"],
  sections: [
    {
      id: "communityState",
      title: "Community-property state",
      items: [
        {
          id: "livedInCommunityState",
          type: "radio",
          label:
            "In the past 8 years did you live in a community-property state or territory?",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "communityState",
          type: "select",
          label: "Which community-property state did you live in?",
          options: US_STATES,
          visibleIf: { fieldId: "livedInCommunityState", equals: "yes" },
        },
      ],
    },
    {
      id: "codebtors",
      title: "Codebtors",
      description:
        "List anyone else who is also liable on a debt owed by you. Don't list spouses if filing jointly.",
      items: [
        {
          kind: "repeating-group",
          id: "codebtors",
          label: "Codebtors",
          itemLabel: "Codebtor",
          fields: [
            { id: "name", type: "text", label: "Codebtor's name" },
            ...addressFields("codebtor"),
            {
              id: "relatedCreditor",
              type: "text",
              label: "Name of creditor on the related debt (from D, E/F, or G)",
            },
            {
              id: "relatedSchedule",
              type: "select",
              label: "Schedule containing the creditor",
              options: [
                { value: "D", label: "Schedule D" },
                { value: "E", label: "Schedule E/F (priority)" },
                { value: "F", label: "Schedule E/F (nonpriority)" },
                { value: "G", label: "Schedule G" },
              ],
            },
            { id: "communityDebt", type: "checkbox", label: "Check if community debt" },
          ],
        },
      ],
    },
  ],
};
