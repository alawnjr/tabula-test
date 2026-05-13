import type { FormSchema } from "./types";

export const eaDistribution: FormSchema = {
  id: "ea-distribution",
  title: "Accounting & Distribution",
  longTitle: "Estate Administration — Accounting & Distribution",
  appliesTo: ["estateAdmin"],
  sections: [
    {
      id: "receipts",
      title: "Receipts during administration",
      description:
        "Money coming into the estate after letters issue — dividends, refunds, sale proceeds, interest, etc. These appear in the accounting's Schedule A.",
      items: [
        {
          kind: "repeating-group",
          id: "receipts",
          label: "Receipt",
          itemLabel: "Receipt",
          fields: [
            { id: "receivedDate", type: "date", label: "Date received" },
            { id: "source", type: "text", label: "Source" },
            {
              id: "kind",
              type: "select",
              label: "Kind",
              options: [
                { value: "interest", label: "Interest" },
                { value: "dividend", label: "Dividend" },
                { value: "rental", label: "Rental income" },
                { value: "refund", label: "Refund" },
                { value: "sale-proceeds", label: "Sale proceeds" },
                { value: "insurance-proceeds", label: "Insurance proceeds" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "amount", type: "currency", label: "Amount" },
            { id: "depositedTo", type: "text", label: "Deposited to (estate account)" },
            { id: "notes", type: "text", label: "Notes" },
          ],
        },
      ],
    },
    {
      id: "disbursements",
      title: "Disbursements during administration",
      description:
        "Money paid out of the estate. Categorized for the accounting and for 706 deduction substantiation.",
      items: [
        {
          kind: "repeating-group",
          id: "disbursements",
          label: "Disbursement",
          itemLabel: "Disbursement",
          fields: [
            { id: "paidDate", type: "date", label: "Date paid" },
            { id: "payee", type: "text", label: "Payee" },
            {
              id: "kind",
              type: "select",
              label: "Kind",
              options: [
                { value: "funeral", label: "Funeral / burial" },
                { value: "creditor-claim", label: "Creditor claim" },
                { value: "tax", label: "Tax payment" },
                { value: "admin-expense", label: "Administration expense" },
                { value: "specific-bequest", label: "Specific bequest" },
                { value: "interim-distribution", label: "Interim distribution" },
                { value: "fiduciary-commission", label: "Fiduciary commission" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "amount", type: "currency", label: "Amount" },
            { id: "checkNumber", type: "text", label: "Check / wire reference" },
            { id: "notes", type: "text", label: "Notes" },
          ],
        },
      ],
    },
    {
      id: "proposedDistributions",
      title: "Proposed final distributions",
      description:
        "Proposed distribution schedule, by beneficiary. The reconciliation engine compares proposed totals against the residuary balance.",
      items: [
        {
          kind: "repeating-group",
          id: "proposedDistributions",
          label: "Proposed distribution",
          itemLabel: "Distribution",
          fields: [
            { id: "beneficiaryName", type: "text", label: "Beneficiary" },
            { id: "cashAmount", type: "currency", label: "Cash" },
            { id: "inKindDescription", type: "textarea", label: "Property in kind" },
            { id: "inKindValue", type: "currency", label: "In-kind value" },
            {
              id: "waiverReceived",
              type: "checkbox",
              label: "Waiver / receipt and release received",
            },
            { id: "fundedDate", type: "date", label: "Date funded" },
          ],
        },
      ],
    },
    {
      id: "accounting",
      title: "Accounting filing",
      items: [
        {
          id: "accountingType",
          type: "select",
          label: "Accounting type",
          options: [
            { value: "informal", label: "Informal (waivers from beneficiaries)" },
            { value: "judicial", label: "Judicial (court-supervised)" },
            { value: "interim", label: "Interim accounting" },
          ],
        },
        {
          id: "accountingPeriodStart",
          type: "date",
          label: "Accounting period — start",
        },
        {
          id: "accountingPeriodEnd",
          type: "date",
          label: "Accounting period — end",
        },
        {
          id: "filedDate",
          type: "date",
          label: "Filing date",
        },
      ],
    },
  ],
};
