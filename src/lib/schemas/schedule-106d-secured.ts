import { addressFields, CLAIM_FLAGS, DEBTOR_LIABLE } from "./common";
import type { FormSchema } from "./types";

export const schedule106D: FormSchema = {
  id: "106D",
  title: "Schedule D — Secured Claims",
  longTitle: "Schedule D — Creditors Who Have Claims Secured by Property",
  appliesTo: ["chapter7", "chapter13"],
  sections: [
    {
      id: "creditors",
      title: "Secured creditors",
      description: "List all creditors who have claims secured by your property.",
      items: [
        {
          kind: "repeating-group",
          id: "securedCreditors",
          label: "Secured creditors",
          itemLabel: "Creditor",
          fields: [
            { id: "creditorName", type: "text", label: "Creditor's name" },
            ...addressFields("creditor"),
            { id: "accountLast4", type: "text", label: "Last 4 of account number" },
            { id: "dateIncurred", type: "date", label: "Date debt was incurred" },
            {
              id: "debtorLiable",
              type: "select",
              label: "Who owes the debt?",
              options: DEBTOR_LIABLE,
            },
            { id: "communityProperty", type: "checkbox", label: "Check if community debt" },
            ...CLAIM_FLAGS,
            {
              id: "lienType",
              type: "select",
              label: "Nature of lien",
              options: [
                { value: "mortgage", label: "Mortgage / deed of trust" },
                { value: "vehicle", label: "Vehicle lien" },
                { value: "judgment", label: "Judgment lien" },
                { value: "statutory", label: "Statutory lien (e.g., tax, mechanic's)" },
                { value: "security", label: "Security interest in personal property" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "collateralDescription", type: "textarea", label: "Description of property securing the claim" },
            { id: "claimAmount", type: "currency", label: "Amount of claim" },
            { id: "collateralValue", type: "currency", label: "Value of collateral that supports this claim" },
            {
              id: "unsecuredPortion",
              type: "currency",
              label: "Unsecured portion (claim − collateral, if positive)",
              help: "Auto-calculated estimate; override if needed.",
            },
          ],
        },
      ],
    },
  ],
};
