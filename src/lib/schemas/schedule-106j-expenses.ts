import type { FormSchema } from "./types";

export const schedule106J: FormSchema = {
  id: "106J",
  title: "Schedule J — Expenses",
  longTitle: "Schedule J — Your Expenses",
  appliesTo: ["chapter7", "chapter13"],
  sections: [
    {
      id: "household",
      title: "Household and dependents",
      items: [
        {
          id: "separateHousehold",
          type: "radio",
          label: "Do you have dependents who live in a separate household?",
          options: [
            { value: "no", label: "No" },
            { value: "yes", label: "Yes — list separate Schedule J-2" },
          ],
        },
        {
          kind: "repeating-group",
          id: "dependents",
          label: "Your dependents",
          itemLabel: "Dependent",
          fields: [
            {
              id: "relationship",
              type: "select",
              label: "Relationship",
              options: [
                { value: "child", label: "Child" },
                { value: "parent", label: "Parent" },
                { value: "spouse", label: "Spouse" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "age", type: "number", label: "Age" },
            { id: "livesWith", type: "checkbox", label: "Lives with you" },
          ],
        },
      ],
    },
    {
      id: "monthlyExpenses",
      title: "Monthly expenses",
      description:
        "Estimate your monthly expenses as of your bankruptcy filing date. Include expenses paid for with non-cash assistance.",
      items: [
        { id: "rentMortgage", type: "currency", label: "Rent or home ownership (rent, mortgage)" },
        { id: "realEstateTaxes", type: "currency", label: "Real estate taxes (if not in mortgage)" },
        { id: "propertyInsurance", type: "currency", label: "Property, homeowner's, or renter's insurance" },
        { id: "homeMaintenance", type: "currency", label: "Home maintenance, repair, and upkeep" },
        { id: "hoa", type: "currency", label: "Homeowner's association or condominium dues" },
        { id: "utilitiesElectricity", type: "currency", label: "Utilities — electricity, heat, natural gas" },
        { id: "utilitiesWater", type: "currency", label: "Utilities — water, sewer, garbage" },
        { id: "utilitiesPhone", type: "currency", label: "Telephone, internet, cell phone, cable" },
        { id: "food", type: "currency", label: "Food and housekeeping supplies" },
        { id: "childcare", type: "currency", label: "Childcare and children's education costs" },
        { id: "clothing", type: "currency", label: "Clothing, laundry, dry cleaning" },
        { id: "personalCare", type: "currency", label: "Personal care products and services" },
        { id: "medical", type: "currency", label: "Medical and dental expenses" },
        { id: "transportation", type: "currency", label: "Transportation (not car payments)" },
        { id: "entertainment", type: "currency", label: "Entertainment, clubs, recreation, newspapers, magazines" },
        { id: "charity", type: "currency", label: "Charitable contributions and religious donations" },
        { id: "lifeInsurance", type: "currency", label: "Life insurance" },
        { id: "healthInsurance", type: "currency", label: "Health insurance" },
        { id: "vehicleInsurance", type: "currency", label: "Vehicle insurance" },
        { id: "otherInsurance", type: "currency", label: "Other insurance" },
        { id: "taxesNotDeducted", type: "currency", label: "Taxes not deducted from wages" },
        { id: "carPayments", type: "currency", label: "Installment payments — car" },
        { id: "otherInstallments", type: "currency", label: "Installment payments — other" },
        { id: "alimonySupport", type: "currency", label: "Alimony / maintenance / support payments" },
        { id: "supportNotIncluded", type: "currency", label: "Support of others not living in household" },
        { id: "otherRealProperty", type: "currency", label: "Expenses from operating a business or rental property" },
        { id: "otherExpenses", type: "currency", label: "Other (specify)" },
        { id: "otherExpensesDesc", type: "text", label: "Description of other" },
      ],
    },
    {
      id: "anticipatedChangesJ",
      title: "Anticipated changes",
      items: [
        {
          id: "anticipatedChanges",
          type: "textarea",
          label:
            "Do you expect a change to expenses within the year after filing? Explain.",
        },
      ],
    },
  ],
};
