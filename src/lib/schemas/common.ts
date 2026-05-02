import type { Field, Option } from "./types";

export const US_STATES: Option[] = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
].map(([value, label]) => ({ value, label }));

export const RANGE_OPTIONS: Option[] = [
  "1-49",
  "50-99",
  "100-199",
  "200-999",
  "1,000-5,000",
  "5,001-10,000",
  "10,001-25,000",
  "25,001-50,000",
  "50,001-100,000",
  "More than 100,000",
].map((v) => ({ value: v, label: v }));

export const MONEY_RANGES: Option[] = [
  "$0 - $50,000",
  "$50,001 - $100,000",
  "$100,001 - $500,000",
  "$500,001 - $1,000,000",
  "$1,000,001 - $10,000,000",
  "$10,000,001 - $50,000,000",
  "$50,000,001 - $100,000,000",
  "$100,000,001 - $500,000,000",
  "$500,000,001 - $1 billion",
  "More than $1 billion",
].map((v) => ({ value: v, label: v }));

export function addressFields(prefix = "address"): Field[] {
  return [
    { id: `${prefix}Street`, type: "text", label: "Street address", placeholder: "123 Main St" },
    { id: `${prefix}Street2`, type: "text", label: "Apt / suite", placeholder: "Apt 4B" },
    { id: `${prefix}City`, type: "text", label: "City" },
    { id: `${prefix}State`, type: "select", label: "State", options: US_STATES },
    { id: `${prefix}Zip`, type: "text", label: "ZIP" },
  ];
}

export function personNameFields(prefix: string, label = "Name"): Field[] {
  return [
    { id: `${prefix}First`, type: "text", label: `${label} — first` },
    { id: `${prefix}Middle`, type: "text", label: `${label} — middle` },
    { id: `${prefix}Last`, type: "text", label: `${label} — last` },
    { id: `${prefix}Suffix`, type: "text", label: `${label} — suffix` },
  ];
}

export const YES_NO: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const DEBTOR_LIABLE: Option[] = [
  { value: "debtor1", label: "Debtor 1 only" },
  { value: "debtor2", label: "Debtor 2 only" },
  { value: "both", label: "Debtor 1 and Debtor 2 only" },
  { value: "atLeastOnePlusOther", label: "At least one of the debtors and another" },
];

export const CLAIM_FLAGS: Field[] = [
  { id: "contingent", type: "checkbox", label: "Contingent" },
  { id: "unliquidated", type: "checkbox", label: "Unliquidated" },
  { id: "disputed", type: "checkbox", label: "Disputed" },
];
