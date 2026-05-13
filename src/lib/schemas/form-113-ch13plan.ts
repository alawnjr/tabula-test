import type { FormSchema } from "./types";

export const form113: FormSchema = {
  id: "113",
  title: "Chapter 13 Plan",
  longTitle: "Form 113 — Chapter 13 Plan",
  appliesTo: ["chapter13"],
  sections: [
    {
      id: "planBasics",
      title: "Part 1 — Plan basics",
      description:
        "State the monthly payment, plan duration, and first payment date.",
      items: [
        {
          id: "monthlyPayment",
          type: "currency",
          label: "Monthly plan payment amount",
          required: true,
          help: "The amount you will pay the trustee each month.",
        },
        {
          id: "planDuration",
          type: "select",
          label: "Plan duration",
          required: true,
          options: [
            { value: "36", label: "36 months" },
            { value: "60", label: "60 months" },
          ],
          help: "Most plans are 36 months; if income exceeds the state median, 60 months is required.",
        },
        {
          id: "firstPaymentDate",
          type: "date",
          label: "First payment due date",
          help: "Must be within 30 days of the petition filing date (11 U.S.C. § 1326(a)(1)).",
        },
        {
          id: "totalPlanPayments",
          type: "currency",
          label: "Total of all plan payments",
          help: "Monthly payment × plan duration in months.",
        },
      ],
    },

    {
      id: "trusteeDistribution",
      title: "Part 2 — Trustee distribution",
      description:
        "How the trustee will pay allowed claims, in the order required by 11 U.S.C. § 1326(b).",
      items: [
        {
          id: "trusteeFeePercent",
          type: "number",
          label: "Trustee's fee (% of each payment)",
          help: "Set by the U.S. Trustee for your district — typically 5–10%.",
          placeholder: "10",
        },
        {
          id: "trusteeFeeMonthly",
          type: "currency",
          label: "Estimated monthly trustee fee",
          help: "Monthly payment × trustee fee %.",
        },
      ],
    },

    {
      id: "securedClaims",
      title: "Part 3 — Secured claims",
      description:
        "Describe how each secured creditor will be treated. Use 3.1 for mortgage arrears, 3.2 for cramdowns, 3.3 for long-term debts paid per contract, and 3.4 for all other secured claims.",
      items: [
        {
          kind: "repeating-group",
          id: "mortgageCure",
          label: "3.1 — Maintenance of payments and cure of arrearage (mortgages)",
          itemLabel: "Mortgage creditor",
          description:
            "The plan will maintain current contractual payments and cure any arrearage over the plan term.",
          fields: [
            { id: "creditorName", type: "text", label: "Creditor's name" },
            { id: "collateralDescription", type: "text", label: "Collateral (property address or description)" },
            { id: "regularMonthlyPayment", type: "currency", label: "Regular monthly contractual payment" },
            { id: "arrearageAmount", type: "currency", label: "Total arrearage to be cured through plan" },
            { id: "monthlyArrearagePayment", type: "currency", label: "Monthly arrearage payment through plan" },
            {
              id: "interestOnArrearage",
              type: "select",
              label: "Interest on arrearage",
              options: [
                { value: "none", label: "No interest" },
                { value: "contractRate", label: "At the contract rate" },
                { value: "planRate", label: "At the plan interest rate" },
              ],
            },
          ],
        },

        {
          kind: "repeating-group",
          id: "valuationCramdown",
          label: "3.2 — Request for valuation / cramdown (vehicles and personal property)",
          itemLabel: "Cramdown claim",
          description:
            "The plan pays the secured portion (collateral value) at the plan interest rate; the remainder is treated as nonpriority unsecured.",
          fields: [
            { id: "creditorName", type: "text", label: "Creditor's name" },
            { id: "collateralDescription", type: "text", label: "Collateral description" },
            { id: "collateralValue", type: "currency", label: "Estimated value of collateral (secured amount)" },
            { id: "interestRate", type: "number", label: "Interest rate on secured portion (%)", placeholder: "5.0" },
            { id: "monthlyPayment", type: "currency", label: "Monthly payment on secured portion" },
            { id: "unsecuredBifurcationAmount", type: "currency", label: "Bifurcated unsecured portion (claim minus collateral value)" },
          ],
        },

        {
          kind: "repeating-group",
          id: "longTermSecured",
          label: "3.3 — Claims excluded from § 1322(b)(2) modification (long-term debts paid per contract)",
          itemLabel: "Long-term secured claim",
          description:
            "Claims on real property that is the debtor's principal residence — not subject to plan modification.",
          fields: [
            { id: "creditorName", type: "text", label: "Creditor's name" },
            { id: "collateralDescription", type: "text", label: "Collateral description" },
            { id: "monthlyPayment", type: "currency", label: "Regular contractual monthly payment" },
            {
              id: "paymentRoute",
              type: "select",
              label: "Payments made",
              options: [
                { value: "direct", label: "Direct to creditor (outside the plan)" },
                { value: "trustee", label: "Through the trustee" },
              ],
            },
          ],
        },

        {
          kind: "repeating-group",
          id: "otherSecured",
          label: "3.4 — Other secured claims",
          itemLabel: "Other secured claim",
          description:
            "All remaining secured claims not covered above (e.g., tax liens, non-real-estate judgment liens).",
          fields: [
            { id: "creditorName", type: "text", label: "Creditor's name" },
            { id: "collateralDescription", type: "text", label: "Collateral description" },
            { id: "claimAmount", type: "currency", label: "Total claim amount" },
            { id: "securedAmount", type: "currency", label: "Secured amount to be paid through plan" },
            { id: "interestRate", type: "number", label: "Interest rate (%)", placeholder: "0" },
            { id: "monthlyPayment", type: "currency", label: "Monthly payment" },
          ],
        },
      ],
    },

    {
      id: "feesAndPriority",
      title: "Part 4 — Fees and priority unsecured claims",
      description:
        "Attorney fees and priority unsecured claims are paid before general unsecured creditors.",
      items: [
        {
          id: "attorneyFeesTotal",
          type: "currency",
          label: "Total attorney's fees (agreed upon)",
        },
        {
          id: "attorneyFeesPrepetition",
          type: "currency",
          label: "Attorney's fees paid before the petition",
        },
        {
          id: "attorneyFeesBalance",
          type: "currency",
          label: "Balance of attorney's fees to be paid through plan",
          help: "Total fees minus pre-petition amount paid.",
        },
        {
          id: "attorneyFeesMonthly",
          type: "currency",
          label: "Monthly attorney's fee payment",
        },
        {
          kind: "repeating-group",
          id: "priorityClaims",
          label: "Priority unsecured claims",
          itemLabel: "Priority claim",
          description:
            "Domestic support obligations, government taxes, and other § 507 priority claims. These must be paid in full.",
          fields: [
            { id: "creditorName", type: "text", label: "Creditor's name" },
            {
              id: "priorityType",
              type: "select",
              label: "Type of priority claim",
              options: [
                { value: "domesticSupport", label: "Domestic support obligation" },
                { value: "incomeTax", label: "Income taxes" },
                { value: "propertyTax", label: "Property taxes" },
                { value: "other", label: "Other priority claim" },
              ],
            },
            { id: "claimAmount", type: "currency", label: "Estimated claim amount" },
            { id: "monthlyPayment", type: "currency", label: "Monthly payment through plan" },
          ],
        },
      ],
    },

    {
      id: "nonpriorityUnsecured",
      title: "Part 5 — Nonpriority unsecured claims",
      description:
        "General unsecured creditors receive the remainder after all secured and priority claims are paid.",
      items: [
        {
          id: "nonpriorityUnsecuredTotal",
          type: "currency",
          label: "Total amount to be paid to nonpriority unsecured creditors",
          help: "May be $0 if disposable income projections do not require payment.",
        },
        {
          id: "nonpriorityProRata",
          type: "radio",
          label: "Distribution method for general unsecured creditors",
          options: [
            { value: "proRata", label: "Pro rata (proportionally among all allowed claims)" },
            { value: "separately", label: "Some claims are separately classified (see below)" },
          ],
        },
        {
          kind: "repeating-group",
          id: "separatelyClassified",
          label: "Separately classified nonpriority unsecured claims",
          itemLabel: "Separately classified claim",
          description:
            "Certain nonpriority claims classified separately (e.g., co-signed debts) and paid differently than the general pool.",
          fields: [
            { id: "creditorName", type: "text", label: "Creditor's name" },
            { id: "basis", type: "text", label: "Basis for separate classification" },
            { id: "treatmentAmount", type: "currency", label: "Amount to be paid to this creditor" },
            { id: "monthlyPayment", type: "currency", label: "Monthly payment" },
          ],
        },
      ],
    },

    {
      id: "executoryContracts",
      title: "Part 6 — Executory contracts and unexpired leases",
      description:
        "State whether each executory contract or unexpired lease will be assumed, rejected, or treated under the plan.",
      items: [
        {
          kind: "repeating-group",
          id: "contracts",
          label: "Contracts and leases",
          itemLabel: "Contract / lease",
          description:
            "Assumed contracts must cure any pre-petition defaults through the plan.",
          fields: [
            { id: "otherParty", type: "text", label: "Name of other party" },
            { id: "description", type: "text", label: "Description of contract or lease" },
            {
              id: "treatment",
              type: "select",
              label: "Plan treatment",
              options: [
                { value: "assume", label: "Assume (keep)" },
                { value: "reject", label: "Reject (terminate)" },
                { value: "assumeAndAssign", label: "Assume and assign" },
              ],
            },
            { id: "cureAmount", type: "currency", label: "Arrearage / cure amount (if assuming)" },
            { id: "monthlyPayment", type: "currency", label: "Monthly payment (if assuming)" },
          ],
        },
      ],
    },

    {
      id: "vesting",
      title: "Part 7 — Vesting of property of the estate",
      description:
        "When property of the bankruptcy estate revests in the debtor.",
      items: [
        {
          id: "vestingEvent",
          type: "radio",
          label: "Property of the estate shall vest in the debtor upon:",
          required: true,
          options: [
            { value: "confirmation", label: "Confirmation of the plan" },
            { value: "discharge", label: "Entry of a discharge order (at plan completion)" },
            { value: "other", label: "Other (specify below)" },
          ],
        },
        {
          id: "vestingOtherDesc",
          type: "textarea",
          label: "If other, describe the vesting condition",
          visibleIf: { fieldId: "vestingEvent", equals: "other" },
        },
      ],
    },

    {
      id: "nonstandard",
      title: "Part 8 — Nonstandard plan provisions",
      description:
        "Any provisions not covered by the standard form. All nonstandard provisions must be specifically identified here to be enforceable.",
      items: [
        {
          id: "nonstandardProvisions",
          type: "textarea",
          label: "Nonstandard provisions",
          help: "If none, leave blank.",
          placeholder: "Describe any nonstandard provisions here…",
        },
      ],
    },
  ],
};
