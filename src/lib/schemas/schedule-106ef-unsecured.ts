import { addressFields, CLAIM_FLAGS, DEBTOR_LIABLE } from "./common";
import type { FormSchema } from "./types";

export const schedule106EF: FormSchema = {
  id: "106EF",
  title: "Schedule E/F — Unsecured Claims",
  longTitle: "Schedule E/F — Creditors Who Have Unsecured Claims",
  appliesTo: ["chapter7", "chapter13"],
  sections: [
    {
      id: "part1Priority",
      title: "Part 1 — Priority unsecured claims",
      description:
        "Domestic support, certain taxes, wages owed to employees, and other priority debts under 11 U.S.C. § 507.",
      items: [
        {
          kind: "repeating-group",
          id: "priorityCreditors",
          label: "Priority creditors",
          itemLabel: "Priority creditor",
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
              id: "priorityType",
              type: "select",
              label: "Type of priority unsecured claim",
              options: [
                { value: "domesticSupport", label: "Domestic support obligations" },
                { value: "taxes", label: "Taxes and certain other debts owed to governmental units" },
                { value: "wages", label: "Wages, salaries, and commissions" },
                { value: "deathOrInjury", label: "Claims for death or personal injury while intoxicated" },
                { value: "other", label: "Other (specify in basis)" },
              ],
            },
            { id: "basis", type: "text", label: "Basis for claim" },
            { id: "totalClaim", type: "currency", label: "Total claim" },
            { id: "priorityAmount", type: "currency", label: "Priority amount" },
            { id: "nonpriorityAmount", type: "currency", label: "Nonpriority amount" },
          ],
        },
      ],
    },
    {
      id: "part2Nonpriority",
      title: "Part 2 — Nonpriority unsecured claims",
      description: "Credit cards, medical bills, personal loans, etc.",
      items: [
        {
          kind: "repeating-group",
          id: "nonpriorityCreditors",
          label: "Nonpriority creditors",
          itemLabel: "Nonpriority creditor",
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
              id: "claimType",
              type: "select",
              label: "Type of nonpriority unsecured claim",
              options: [
                { value: "studentLoans", label: "Student loans" },
                { value: "domesticObligations", label: "Obligations from a divorce or separation that you did not report as priority" },
                { value: "pensions", label: "Debts to pension or profit-sharing plans" },
                { value: "other", label: "Other (e.g., credit card, medical, personal loan)" },
              ],
            },
            { id: "basis", type: "text", label: "Basis for claim" },
            { id: "claimAmount", type: "currency", label: "Amount of claim" },
          ],
        },
      ],
    },
    {
      id: "part3Notification",
      title: "Part 3 — Others to be notified",
      description:
        "Anyone else who should be notified about a debt already listed in Part 1 or Part 2 (e.g., a collection agency).",
      items: [
        {
          kind: "repeating-group",
          id: "notificationOnly",
          label: "Notification recipients",
          itemLabel: "Recipient",
          fields: [
            { id: "name", type: "text", label: "Name" },
            ...addressFields("recipient"),
            { id: "relatedCreditor", type: "text", label: "Related creditor (from Part 1 or 2)" },
            { id: "lastFour", type: "text", label: "Last 4 of account number" },
          ],
        },
      ],
    },
  ],
};
