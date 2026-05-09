import { US_STATES } from "./common";
import type { FormSchema } from "./types";

// Form 122A-1 — Statement of Your Current Monthly Income.
// Simplified: averages the last 6 months across the major income categories
// the official form asks about. Output drives the median-income comparison
// that determines whether the presumption of abuse arises (Form 122A-2).
export const form122A1: FormSchema = {
  id: "122A-1",
  title: "Form 122A-1 — Current monthly income",
  longTitle:
    "Chapter 7 Statement of Your Current Monthly Income (Official Form 122A-1)",
  appliesTo: ["meansTest", "chapter7"],
  sections: [
    {
      id: "household",
      title: "Marital and household status",
      description:
        "Your marital status and household size determine the median-income threshold you'll be compared against.",
      items: [
        {
          id: "maritalStatus",
          type: "radio",
          label: "What is your marital status?",
          options: [
            { value: "notMarried", label: "Not married" },
            { value: "marriedFilingJointly", label: "Married — filing jointly" },
            {
              value: "marriedFilingAlone",
              label: "Married — filing alone (spouse separately or not at all)",
            },
          ],
        },
        {
          id: "residenceState",
          type: "select",
          label: "State of residence",
          options: US_STATES,
        },
        {
          id: "householdSize",
          type: "number",
          label: "Household size (you + dependents)",
          help: "Used to look up the state median income.",
        },
      ],
    },
    {
      id: "incomeDebtor1",
      title: "Average monthly income — Debtor 1",
      description:
        "Average each category over the 6 calendar months ending on the last day of the month before you file. Enter monthly amounts.",
      items: [
        {
          id: "mt1d1Wages",
          type: "currency",
          label: "Gross wages, salary, tips, bonuses, overtime, commissions",
        },
        {
          id: "mt1d1Business",
          type: "currency",
          label: "Net income from operating a business, profession, or farm",
        },
        {
          id: "mt1d1Rental",
          type: "currency",
          label: "Net rent and other real-property income",
        },
        {
          id: "mt1d1InterestDividends",
          type: "currency",
          label: "Interest, dividends, and royalties",
        },
        {
          id: "mt1d1Pension",
          type: "currency",
          label: "Pension or retirement income",
        },
        {
          id: "mt1d1Unemployment",
          type: "currency",
          label: "Unemployment compensation",
        },
        {
          id: "mt1d1Support",
          type: "currency",
          label: "Family support — alimony, child support, or other",
        },
        {
          id: "mt1d1Other",
          type: "currency",
          label: "Other income (specify in description below)",
        },
        {
          id: "mt1d1OtherDescription",
          type: "text",
          label: "Description of other income",
        },
      ],
    },
    {
      id: "incomeDebtor2",
      title: "Average monthly income — Debtor 2 / spouse",
      description:
        "Required for joint filings. If filing alone but married and not legally separated, you may still need to include spouse income — see the form instructions.",
      items: [
        {
          id: "mt1d2Wages",
          type: "currency",
          label: "Gross wages, salary, tips, bonuses, overtime, commissions",
        },
        {
          id: "mt1d2Business",
          type: "currency",
          label: "Net income from operating a business, profession, or farm",
        },
        {
          id: "mt1d2Rental",
          type: "currency",
          label: "Net rent and other real-property income",
        },
        {
          id: "mt1d2InterestDividends",
          type: "currency",
          label: "Interest, dividends, and royalties",
        },
        {
          id: "mt1d2Pension",
          type: "currency",
          label: "Pension or retirement income",
        },
        {
          id: "mt1d2Unemployment",
          type: "currency",
          label: "Unemployment compensation",
        },
        {
          id: "mt1d2Support",
          type: "currency",
          label: "Family support — alimony, child support, or other",
        },
        {
          id: "mt1d2Other",
          type: "currency",
          label: "Other income",
        },
      ],
    },
    {
      id: "exclusions",
      title: "Statutory exclusions",
      description:
        "Certain benefits are excluded from current monthly income. Enter monthly averages for the items that apply.",
      items: [
        {
          id: "mt1ExcludedSocialSecurity",
          type: "currency",
          label: "Social Security Act benefits",
        },
        {
          id: "mt1ExcludedVictim",
          type: "currency",
          label: "Payments to victims of war, terrorism, or international crimes",
        },
        {
          id: "mt1ExcludedDescription",
          type: "textarea",
          label: "Other excluded benefits — description and monthly amount",
        },
      ],
    },
  ],
};
