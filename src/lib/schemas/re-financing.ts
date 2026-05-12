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
    {
      id: "coopLoan",
      title: "Co-op financing (UCC / share loan)",
      description:
        "Co-ops are personal property — the lender takes a security interest in the shares and proprietary lease rather than a mortgage on real property. The lender files a UCC-1 financing statement (not a mortgage) and obtains a recognition agreement from the co-op corporation.",
      items: [
        {
          id: "coopLoanApplicable",
          type: "radio",
          label: "Is this a co-op share loan (not a mortgage)?",
          options: YES_NO,
        },
        {
          id: "coopLender",
          type: "text",
          label: "Co-op lender / bank name",
          visibleIf: { fieldId: "coopLoanApplicable", equals: "yes" },
        },
        {
          id: "coopLoanOfficer",
          type: "text",
          label: "Loan officer",
          visibleIf: { fieldId: "coopLoanApplicable", equals: "yes" },
        },
        {
          id: "coopLoanAmount",
          type: "currency",
          label: "Share loan amount",
          visibleIf: { fieldId: "coopLoanApplicable", equals: "yes" },
        },
        {
          id: "coopLoanCommitmentReceived",
          type: "radio",
          label: "Loan commitment received?",
          options: YES_NO,
          visibleIf: { fieldId: "coopLoanApplicable", equals: "yes" },
        },
        {
          id: "coopLoanCommitmentDate",
          type: "date",
          label: "Loan commitment date",
          visibleIf: { fieldId: "coopLoanCommitmentReceived", equals: "yes" },
        },
        {
          id: "recognitionAgreementRequested",
          type: "radio",
          label: "Recognition agreement requested from co-op corporation?",
          help: "The co-op must acknowledge the lender's security interest in the shares and agree to notify lender of default; required by virtually all co-op lenders",
          options: YES_NO,
          visibleIf: { fieldId: "coopLoanApplicable", equals: "yes" },
        },
        {
          id: "recognitionAgreementReceived",
          type: "radio",
          label: "Recognition agreement received and signed?",
          options: YES_NO,
          visibleIf: { fieldId: "recognitionAgreementRequested", equals: "yes" },
        },
        {
          id: "ucc1Filed",
          type: "radio",
          label: "UCC-1 financing statement filed by lender?",
          help: "Filed with NY Secretary of State to perfect security interest in the shares (UCC Article 9)",
          options: YES_NO,
          visibleIf: { fieldId: "coopLoanApplicable", equals: "yes" },
        },
        {
          id: "ucc1FilingDate",
          type: "date",
          label: "UCC-1 filing date",
          visibleIf: { fieldId: "ucc1Filed", equals: "yes" },
        },
        {
          id: "ucc1FilingNumber",
          type: "text",
          label: "UCC-1 filing number",
          visibleIf: { fieldId: "ucc1Filed", equals: "yes" },
        },
        {
          id: "proprietaryLeaseAssigned",
          type: "radio",
          label: "Proprietary lease assigned to lender as additional collateral?",
          options: YES_NO,
          visibleIf: { fieldId: "coopLoanApplicable", equals: "yes" },
        },
      ],
    },
  ],
};
