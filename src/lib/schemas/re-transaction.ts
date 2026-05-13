import type { FormSchema } from "./types";

export const reTransaction: FormSchema = {
  id: "re-transaction",
  title: "Transaction Terms",
  longTitle: "Real Estate — Purchase Agreement & Terms",
  appliesTo: ["realEstate"],
  sections: [
    {
      id: "terms",
      title: "Transaction terms",
      items: [
        {
          id: "transactionType",
          type: "select",
          label: "Transaction type",
          required: true,
          options: [
            { value: "purchase", label: "Purchase" },
            { value: "sale", label: "Sale" },
            { value: "refinance", label: "Refinance" },
            { value: "lease", label: "Lease" },
            { value: "exchange", label: "1031 Exchange" },
          ],
        },
        { id: "purchasePrice", type: "currency", label: "Purchase / sale price", required: true },
        { id: "earnestMoney", type: "currency", label: "Earnest money deposit" },
        { id: "contractDate", type: "date", label: "Contract acceptance / execution date" },
        { id: "expectedClosingDate", type: "date", label: "Expected closing date" },
        { id: "possessionDate", type: "date", label: "Possession date" },
      ],
    },
    {
      id: "contingencies",
      title: "Contingencies",
      description: "List each contingency and its deadline.",
      items: [
        {
          kind: "repeating-group",
          id: "contingencies",
          label: "Contingencies",
          itemLabel: "Contingency",
          fields: [
            {
              id: "contingencyType",
              type: "select",
              label: "Type",
              required: true,
              options: [
                { value: "financing", label: "Financing / mortgage" },
                { value: "inspection", label: "Inspection" },
                { value: "appraisal", label: "Appraisal" },
                { value: "title", label: "Title review" },
                { value: "sale-of-other", label: "Sale of other property" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "contingencyDeadline", type: "date", label: "Deadline" },
            { id: "contingencyNotes", type: "textarea", label: "Notes" },
          ],
        },
      ],
    },
    {
      id: "inspections",
      title: "Inspection",
      items: [
        { id: "inspectionDate", type: "date", label: "Inspection date" },
        { id: "inspectorName", type: "text", label: "Inspector name" },
        { id: "inspectorPhone", type: "text", label: "Inspector phone" },
        { id: "inspectionNotes", type: "textarea", label: "Inspection notes / issues identified" },
      ],
    },
  ],
};
