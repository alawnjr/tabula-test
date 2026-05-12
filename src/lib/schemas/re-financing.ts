import { YES_NO } from "./common";
import type { FormSchema } from "./types";

export const reFinancing: FormSchema = {
  id: "re-financing",
  title: "Financing",
  longTitle: "Real Estate — Financing & Mortgage",
  appliesTo: ["realEstate"],
  sections: [
    {
      id: "loan",
      title: "Loan details",
      items: [
        {
          id: "financingType",
          type: "select",
          label: "Financing type",
          required: true,
          options: [
            { value: "cash", label: "Cash / no financing" },
            { value: "conventional", label: "Conventional" },
            { value: "fha", label: "FHA" },
            { value: "va", label: "VA" },
            { value: "usda", label: "USDA" },
            { value: "other", label: "Other" },
          ],
        },
        { id: "lenderName", type: "text", label: "Lender / bank name" },
        { id: "loanOfficerName", type: "text", label: "Loan officer name" },
        { id: "loanOfficerPhone", type: "text", label: "Loan officer phone" },
        { id: "loanOfficerEmail", type: "text", label: "Loan officer email" },
        { id: "loanAmount", type: "currency", label: "Loan amount" },
        { id: "interestRate", type: "number", label: "Interest rate (%)" },
        { id: "loanTermYears", type: "number", label: "Loan term (years)" },
        {
          id: "preApprovalReceived",
          type: "radio",
          label: "Pre-approval letter received?",
          options: YES_NO,
        },
        {
          id: "commitmentDate",
          type: "date",
          label: "Loan commitment deadline",
        },
      ],
    },
    {
      id: "down",
      title: "Down payment",
      items: [
        { id: "downPaymentAmount", type: "currency", label: "Down payment amount" },
        { id: "downPaymentSource", type: "text", label: "Source of down payment funds" },
      ],
    },
  ],
};
