import type { FormSchema } from "./types";

export const piDamages: FormSchema = {
  id: "pi-damages",
  title: "Damages & Losses",
  longTitle: "Personal Injury — Damages & Economic Losses",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "employment",
      title: "Lost income",
      description: "Complete if the client missed work or lost income due to the injuries.",
      items: [
        { id: "employerName", type: "text", label: "Employer name" },
        { id: "jobTitle", type: "text", label: "Job title / occupation" },
        { id: "hoursPerWeek", type: "number", label: "Hours worked per week" },
        { id: "hourlyRate", type: "currency", label: "Hourly rate (or annual salary)" },
        { id: "missedDaysFrom", type: "date", label: "Missed work — from" },
        { id: "missedDaysTo", type: "date", label: "Missed work — to" },
        { id: "totalLostWages", type: "currency", label: "Total lost wages to date" },
        { id: "futureLostWages", type: "currency", label: "Estimated future lost wages / lost earning capacity" },
      ],
    },
    {
      id: "financial",
      title: "Medical & other damages",
      items: [
        { id: "totalMedicalBills", type: "currency", label: "Total medical bills to date" },
        { id: "estimatedFutureMedical", type: "currency", label: "Estimated future medical costs" },
        { id: "propertyDamage", type: "currency", label: "Property damage (e.g., vehicle repair)" },
        {
          id: "painAndSuffering",
          type: "textarea",
          label: "Notes on pain, suffering, and non-economic damages",
          placeholder: "Describe the impact on the client's daily life, activities, and well-being",
        },
      ],
    },
  ],
};
