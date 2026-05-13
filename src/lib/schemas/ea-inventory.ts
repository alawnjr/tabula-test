import { US_STATES, YES_NO } from "./common";
import type { FormSchema } from "./types";

const TITLE_TYPE_OPTIONS = [
  { value: "individual", label: "Individual — passes through probate" },
  { value: "joint-tenancy", label: "Joint tenancy with right of survivorship" },
  { value: "tenancy-in-common", label: "Tenancy in common" },
  { value: "tenancy-by-entirety", label: "Tenancy by the entirety" },
  { value: "community-property", label: "Community property" },
  { value: "trust", label: "Titled in trust" },
  { value: "tod-pod", label: "TOD / POD designation" },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "money-market", label: "Money market" },
  { value: "cd", label: "Certificate of deposit" },
  { value: "brokerage", label: "Brokerage" },
  { value: "529", label: "529" },
  { value: "other", label: "Other" },
];

const RETIREMENT_TYPE_OPTIONS = [
  { value: "401k", label: "401(k)" },
  { value: "403b", label: "403(b)" },
  { value: "ira-traditional", label: "Traditional IRA" },
  { value: "ira-roth", label: "Roth IRA" },
  { value: "pension", label: "Defined-benefit pension" },
  { value: "annuity", label: "Annuity" },
  { value: "other", label: "Other" },
];

export const eaInventory: FormSchema = {
  id: "ea-inventory",
  title: "Inventory",
  longTitle: "Estate Administration — Inventory & Appraisement",
  appliesTo: ["estateAdmin"],
  sections: [
    {
      id: "realProperty",
      title: "Real property",
      items: [
        {
          kind: "repeating-group",
          id: "realProperty",
          label: "Real property",
          itemLabel: "Property",
          fields: [
            { id: "description", type: "text", label: "Short description", placeholder: "Primary residence / vacation home / rental" },
            { id: "addressStreet", type: "text", label: "Street address" },
            { id: "addressCity", type: "text", label: "City" },
            { id: "addressState", type: "select", label: "State", options: US_STATES },
            { id: "addressZip", type: "text", label: "ZIP" },
            { id: "parcelId", type: "text", label: "Parcel / tax ID" },
            { id: "titleType", type: "select", label: "How titled", options: TITLE_TYPE_OPTIONS },
            { id: "coOwnerName", type: "text", label: "Co-owner (if any)" },
            { id: "dateOfDeathValue", type: "currency", label: "Date-of-death value" },
            { id: "appraisalDate", type: "date", label: "Appraisal date" },
            { id: "appraiser", type: "text", label: "Appraiser" },
            { id: "mortgageBalance", type: "currency", label: "Outstanding mortgage" },
            { id: "ancillaryStateRequired", type: "checkbox", label: "Ancillary administration required (out-of-state)" },
          ],
        },
      ],
    },
    {
      id: "financial",
      title: "Financial accounts",
      items: [
        {
          kind: "repeating-group",
          id: "financialAccounts",
          label: "Financial account",
          itemLabel: "Account",
          fields: [
            { id: "institution", type: "text", label: "Institution" },
            { id: "accountType", type: "select", label: "Account type", options: ACCOUNT_TYPE_OPTIONS },
            { id: "lastFour", type: "text", label: "Last four" },
            { id: "titleType", type: "select", label: "How titled", options: TITLE_TYPE_OPTIONS },
            { id: "coOwnerName", type: "text", label: "Co-owner (if any)" },
            { id: "todBeneficiary", type: "text", label: "TOD / POD beneficiary (if any)" },
            { id: "dateOfDeathValue", type: "currency", label: "Date-of-death balance" },
            { id: "incomeAfterDeath", type: "currency", label: "Income earned post-death (for 1041)" },
          ],
        },
      ],
    },
    {
      id: "retirement",
      title: "Retirement accounts",
      description:
        "Retirement accounts pass by beneficiary designation, not through probate — but are included in the federal gross estate. The reconciliation engine cross-checks the designated beneficiary against the will's residuary recipients.",
      items: [
        {
          kind: "repeating-group",
          id: "retirementAccounts",
          label: "Retirement account",
          itemLabel: "Account",
          fields: [
            { id: "institution", type: "text", label: "Institution" },
            { id: "accountType", type: "select", label: "Type", options: RETIREMENT_TYPE_OPTIONS },
            { id: "lastFour", type: "text", label: "Last four" },
            { id: "dateOfDeathValue", type: "currency", label: "Date-of-death value" },
            { id: "designatedBeneficiary", type: "text", label: "Primary designated beneficiary" },
            { id: "designatedContingent", type: "text", label: "Contingent beneficiary" },
            {
              id: "designationConfirmed",
              type: "radio",
              label: "Designation confirmed in writing from custodian?",
              options: YES_NO,
            },
            {
              id: "rmdStatus",
              type: "select",
              label: "Required minimum distribution status",
              options: [
                { value: "not-applicable", label: "N/A (decedent was pre-RMD)" },
                { value: "current", label: "Current through DOD" },
                { value: "delinquent", label: "Delinquent — needs catch-up" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "lifeInsurance",
      title: "Life insurance",
      items: [
        {
          kind: "repeating-group",
          id: "lifeInsurance",
          label: "Life insurance policy",
          itemLabel: "Policy",
          fields: [
            { id: "insurer", type: "text", label: "Insurance carrier" },
            { id: "policyNumber", type: "text", label: "Policy number" },
            { id: "owner", type: "text", label: "Policy owner" },
            { id: "deathBenefit", type: "currency", label: "Death benefit" },
            { id: "designatedBeneficiary", type: "text", label: "Designated beneficiary" },
            {
              id: "estateIsBeneficiary",
              type: "radio",
              label: "Is the estate the beneficiary?",
              options: YES_NO,
              help: "If yes, proceeds are subject to creditor claims.",
            },
            {
              id: "iLitInsurance",
              type: "checkbox",
              label: "Owned by ILIT (out of federal gross estate)",
            },
          ],
        },
      ],
    },
    {
      id: "vehicles",
      title: "Vehicles",
      items: [
        {
          kind: "repeating-group",
          id: "vehicles",
          label: "Vehicle",
          itemLabel: "Vehicle",
          fields: [
            { id: "year", type: "number", label: "Year" },
            { id: "make", type: "text", label: "Make" },
            { id: "model", type: "text", label: "Model" },
            { id: "vin", type: "text", label: "VIN" },
            { id: "titleType", type: "select", label: "How titled", options: TITLE_TYPE_OPTIONS },
            { id: "dateOfDeathValue", type: "currency", label: "Date-of-death value" },
            { id: "loanBalance", type: "currency", label: "Outstanding loan" },
          ],
        },
      ],
    },
    {
      id: "personal",
      title: "Personal property",
      items: [
        {
          kind: "repeating-group",
          id: "personalProperty",
          label: "Personal property",
          itemLabel: "Item / category",
          fields: [
            { id: "description", type: "text", label: "Description / category", placeholder: "Household furnishings, jewelry, firearms…" },
            { id: "appraised", type: "checkbox", label: "Professionally appraised" },
            { id: "dateOfDeathValue", type: "currency", label: "Date-of-death value" },
            { id: "specificBequest", type: "checkbox", label: "Subject to specific bequest in will" },
          ],
        },
      ],
    },
    {
      id: "business",
      title: "Business interests",
      items: [
        {
          kind: "repeating-group",
          id: "businessInterests",
          label: "Business interest",
          itemLabel: "Interest",
          fields: [
            { id: "entityName", type: "text", label: "Entity name" },
            {
              id: "entityType",
              type: "select",
              label: "Entity type",
              options: [
                { value: "sole-proprietor", label: "Sole proprietorship" },
                { value: "partnership", label: "Partnership" },
                { value: "llc", label: "LLC" },
                { value: "s-corp", label: "S-corporation" },
                { value: "c-corp", label: "C-corporation" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "ownershipPercent", type: "number", label: "Ownership %" },
            { id: "ein", type: "text", label: "EIN" },
            { id: "dateOfDeathValue", type: "currency", label: "Date-of-death value" },
            {
              id: "buySellAgreement",
              type: "radio",
              label: "Buy-sell agreement exists?",
              options: YES_NO,
            },
          ],
        },
      ],
    },
  ],
};
