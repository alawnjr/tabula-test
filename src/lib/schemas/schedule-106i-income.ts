import { addressFields } from "./common";
import type { Field, FormSchema } from "./types";

function employmentBlock(prefix: string, label: string): Field[] {
  return [
    {
      id: `${prefix}EmploymentStatus`,
      type: "select",
      label: `${label} employment status`,
      options: [
        { value: "employed", label: "Employed" },
        { value: "notEmployed", label: "Not employed" },
        { value: "selfEmployed", label: "Self-employed" },
        { value: "retired", label: "Retired" },
      ],
    },
    { id: `${prefix}Occupation`, type: "text", label: `${label} occupation` },
    { id: `${prefix}Employer`, type: "text", label: `${label} employer name` },
    ...addressFields(`${prefix}Employer`).map((f) => ({
      ...f,
      label: `${label} employer — ${f.label.toLowerCase()}`,
    })),
    {
      id: `${prefix}EmployedSince`,
      type: "date",
      label: `${label} how long employed there?`,
      help: "Date employment began.",
    },
  ];
}

export const schedule106I: FormSchema = {
  id: "106I",
  title: "Schedule I — Income",
  longTitle: "Schedule I — Your Income",
  appliesTo: ["chapter7", "chapter13"],
  sections: [
    {
      id: "marital",
      title: "Marital status",
      items: [
        {
          id: "maritalStatus",
          type: "radio",
          label: "What is your marital status?",
          options: [
            { value: "notMarried", label: "Not married" },
            { value: "married", label: "Married" },
          ],
        },
        {
          id: "fillingType",
          type: "radio",
          label: "Filing as",
          options: [
            { value: "individual", label: "Individual" },
            { value: "joint", label: "Joint with spouse" },
          ],
        },
      ],
    },
    {
      id: "debtor1Employment",
      title: "Employment — Debtor 1",
      items: employmentBlock("debtor1", "Debtor 1"),
    },
    {
      id: "debtor2Employment",
      title: "Employment — Debtor 2 (if joint)",
      items: employmentBlock("debtor2", "Debtor 2"),
    },
    {
      id: "monthlyIncomeDebtor1",
      title: "Monthly income — Debtor 1",
      items: [
        { id: "d1GrossWages", type: "currency", label: "Gross wages, salary, commissions, bonuses (before deductions)" },
        { id: "d1OvertimePay", type: "currency", label: "Estimated overtime pay" },
        { id: "d1PayrollTax", type: "currency", label: "Payroll deduction — tax, Medicare, Social Security" },
        { id: "d1MandatoryRetirement", type: "currency", label: "Payroll deduction — mandatory contributions for retirement" },
        { id: "d1VoluntaryRetirement", type: "currency", label: "Payroll deduction — voluntary contributions for retirement" },
        { id: "d1RepaymentLoans", type: "currency", label: "Payroll deduction — required repayments of retirement loans" },
        { id: "d1Insurance", type: "currency", label: "Payroll deduction — insurance" },
        { id: "d1DomesticSupport", type: "currency", label: "Payroll deduction — domestic support obligations" },
        { id: "d1UnionDues", type: "currency", label: "Payroll deduction — union dues" },
        { id: "d1OtherDeductions", type: "currency", label: "Payroll deduction — other" },
      ],
    },
    {
      id: "monthlyIncomeDebtor2",
      title: "Monthly income — Debtor 2 (if joint)",
      items: [
        { id: "d2GrossWages", type: "currency", label: "Gross wages, salary, commissions, bonuses (before deductions)" },
        { id: "d2OvertimePay", type: "currency", label: "Estimated overtime pay" },
        { id: "d2PayrollTax", type: "currency", label: "Payroll deduction — tax, Medicare, Social Security" },
        { id: "d2MandatoryRetirement", type: "currency", label: "Payroll deduction — mandatory contributions for retirement" },
        { id: "d2VoluntaryRetirement", type: "currency", label: "Payroll deduction — voluntary contributions for retirement" },
        { id: "d2RepaymentLoans", type: "currency", label: "Payroll deduction — required repayments of retirement loans" },
        { id: "d2Insurance", type: "currency", label: "Payroll deduction — insurance" },
        { id: "d2DomesticSupport", type: "currency", label: "Payroll deduction — domestic support obligations" },
        { id: "d2UnionDues", type: "currency", label: "Payroll deduction — union dues" },
        { id: "d2OtherDeductions", type: "currency", label: "Payroll deduction — other" },
      ],
    },
    {
      id: "otherIncome",
      title: "Other monthly income",
      items: [
        {
          kind: "repeating-group",
          id: "otherIncome",
          label: "Other income sources",
          itemLabel: "Income source",
          fields: [
            {
              id: "type",
              type: "select",
              label: "Type",
              options: [
                { value: "businessNet", label: "Net income from rental, business, profession, or farm" },
                { value: "interest", label: "Interest and dividends" },
                { value: "familySupport", label: "Family support payments / alimony / child support / other" },
                { value: "unemployment", label: "Unemployment compensation" },
                { value: "socialSecurity", label: "Social Security" },
                { value: "government", label: "Other government assistance" },
                { value: "pension", label: "Pension or retirement income" },
                { value: "other", label: "Other (specify)" },
              ],
            },
            { id: "description", type: "text", label: "Description (if other)" },
            { id: "debtor1Amount", type: "currency", label: "Debtor 1 — monthly amount" },
            { id: "debtor2Amount", type: "currency", label: "Debtor 2 — monthly amount" },
          ],
        },
      ],
    },
    {
      id: "anticipatedChanges",
      title: "Anticipated changes",
      items: [
        {
          id: "anticipatedChanges",
          type: "textarea",
          label:
            "Do you expect an increase or decrease within the year after you file this form? Explain.",
        },
      ],
    },
  ],
};
