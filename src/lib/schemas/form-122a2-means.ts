import type { FormSchema } from "./types";

// Form 122A-2 — Means Test Calculation. Only required when 122A-1 indicates
// current monthly income above the applicable state median. The fields below
// follow the IRS-standard / actual-expense buckets used by the official form.
export const form122A2: FormSchema = {
  id: "122A-2",
  title: "Form 122A-2 — Means test calculation",
  longTitle:
    "Chapter 7 Means Test Calculation (Official Form 122A-2)",
  appliesTo: ["meansTest", "chapter7"],
  sections: [
    {
      id: "national",
      title: "IRS national standards",
      description:
        "Pre-set monthly allowances by household size for food, clothing, personal care, and out-of-pocket health care.",
      items: [
        {
          id: "mt2NationalFoodEtc",
          type: "currency",
          label: "Food, clothing, household supplies, personal care",
          help:
            "Use the national-standards table for your household size on the IRS website.",
        },
        {
          id: "mt2NationalHealthUnder65",
          type: "currency",
          label: "Out-of-pocket health care — household members under 65",
        },
        {
          id: "mt2NationalHealthOver65",
          type: "currency",
          label: "Out-of-pocket health care — household members 65 and over",
        },
      ],
    },
    {
      id: "local",
      title: "IRS local standards",
      description:
        "Housing, utilities, and transportation allowances by county and region.",
      items: [
        {
          id: "mt2HousingNonMortgage",
          type: "currency",
          label: "Housing and utilities — non-mortgage allowance",
        },
        {
          id: "mt2HousingMortgage",
          type: "currency",
          label: "Housing and utilities — mortgage / rent allowance",
        },
        {
          id: "mt2TransportOperating",
          type: "currency",
          label: "Vehicle operating expenses (per region, per number of vehicles)",
        },
        {
          id: "mt2TransportOwnership",
          type: "currency",
          label: "Vehicle ownership / lease — Vehicle 1",
        },
        {
          id: "mt2TransportOwnership2",
          type: "currency",
          label: "Vehicle ownership / lease — Vehicle 2",
        },
        {
          id: "mt2PublicTransport",
          type: "currency",
          label: "Public transportation expenses",
        },
      ],
    },
    {
      id: "other",
      title: "Other necessary expenses",
      description:
        "Actual monthly amounts. The official form caps several of these — see instructions.",
      items: [
        {
          id: "mt2Taxes",
          type: "currency",
          label: "Taxes — federal, state, local; self-employment",
        },
        {
          id: "mt2InvoluntaryDeductions",
          type: "currency",
          label: "Mandatory payroll deductions (union dues, uniforms, retirement)",
        },
        {
          id: "mt2Insurance",
          type: "currency",
          label: "Life insurance — term only, debtor's own policy",
        },
        {
          id: "mt2CourtOrdered",
          type: "currency",
          label: "Court-ordered payments (alimony, child support)",
        },
        {
          id: "mt2EducationDisabled",
          type: "currency",
          label: "Education — disabled child or required for employment",
        },
        {
          id: "mt2ChildcareEducation",
          type: "currency",
          label: "Childcare and elementary/secondary education (under cap)",
        },
        {
          id: "mt2HealthcareNotCovered",
          type: "currency",
          label: "Health care expenses not covered by insurance",
        },
        {
          id: "mt2TelecomBeyondBasic",
          type: "currency",
          label: "Telecommunication services beyond basic phone",
        },
      ],
    },
    {
      id: "additional",
      title: "Additional expense deductions",
      items: [
        {
          id: "mt2HealthInsurance",
          type: "currency",
          label: "Health insurance premiums",
        },
        {
          id: "mt2DependentCare",
          type: "currency",
          label: "Care of household / family member who is elderly, ill, or disabled",
        },
        {
          id: "mt2Protection",
          type: "currency",
          label: "Protection against family violence",
        },
        {
          id: "mt2EnergyExcess",
          type: "currency",
          label: "Home energy costs above the IRS allowance",
        },
        {
          id: "mt2EducationChildren",
          type: "currency",
          label: "Education for dependent children under 18 (under cap)",
        },
        {
          id: "mt2FoodClothingExcess",
          type: "currency",
          label: "Food and clothing above the standard (capped at 5% over)",
        },
        {
          id: "mt2Charity",
          type: "currency",
          label: "Continued charitable contributions",
        },
      ],
    },
    {
      id: "debtPayments",
      title: "Debt payments and priorities",
      description:
        "Average monthly amounts for secured debt payments and priority claims.",
      items: [
        {
          id: "mt2SecuredDebtAvg",
          type: "currency",
          label: "Average monthly payments on secured debts (60-month average)",
        },
        {
          id: "mt2SecuredArrears",
          type: "currency",
          label: "Past-due amounts on secured debts (1/60 of the cure)",
        },
        {
          id: "mt2PriorityClaims",
          type: "currency",
          label: "Priority claims (1/60 of total)",
        },
        {
          id: "mt2ChapterAdmin",
          type: "currency",
          label: "Projected Chapter 13 administrative expense (informational)",
        },
      ],
    },
  ],
};
