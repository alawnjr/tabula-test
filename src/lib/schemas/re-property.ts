import { addressFields, US_STATES, YES_NO } from "./common";
import type { FormSchema } from "./types";

export const reProperty: FormSchema = {
  id: "re-property",
  title: "Property Details",
  longTitle: "Real Estate — Property Information",
  appliesTo: ["realEstate"],
  sections: [
    {
      id: "property",
      title: "Property information",
      items: [
        ...addressFields("property"),
        { id: "propertyCounty", type: "text", label: "County" },
        {
          id: "nycBorough",
          type: "select",
          label: "NYC borough (if applicable)",
          options: [
            { value: "manhattan", label: "Manhattan (New York County)" },
            { value: "brooklyn", label: "Brooklyn (Kings County)" },
            { value: "queens", label: "Queens (Queens County)" },
            { value: "bronx", label: "Bronx (Bronx County)" },
            { value: "staten-island", label: "Staten Island (Richmond County)" },
            { value: "outside-nyc", label: "Outside NYC" },
          ],
        },
        {
          id: "propertyType",
          type: "select",
          label: "Property type",
          required: true,
          options: [
            { value: "single-family", label: "Single-family residential" },
            { value: "condo", label: "Condominium" },
            { value: "coop", label: "Co-op (cooperative)" },
            { value: "townhouse", label: "Townhouse" },
            { value: "multi-unit", label: "Multi-unit (2–4 units)" },
            { value: "commercial", label: "Commercial" },
            { value: "land", label: "Vacant land" },
            { value: "other", label: "Other" },
          ],
        },
        { id: "squareFeet", type: "number", label: "Square footage" },
        { id: "bedrooms", type: "number", label: "Bedrooms" },
        { id: "bathrooms", type: "number", label: "Bathrooms" },
        { id: "yearBuilt", type: "number", label: "Year built" },
        { id: "mlsNumber", type: "text", label: "MLS number (if applicable)" },
        { id: "taxParcel", type: "text", label: "Tax parcel / APN number" },
        { id: "legalDescription", type: "textarea", label: "Legal description" },
      ],
    },
    {
      id: "hoa",
      title: "Homeowners association",
      items: [
        {
          id: "hoaExists",
          type: "radio",
          label: "Is there a homeowners association?",
          options: YES_NO,
        },
        {
          id: "hoaName",
          type: "text",
          label: "HOA name",
          visibleIf: { fieldId: "hoaExists", equals: "yes" },
        },
        {
          id: "hoaMonthlyFee",
          type: "currency",
          label: "Monthly HOA fee",
          visibleIf: { fieldId: "hoaExists", equals: "yes" },
        },
        {
          id: "hoaContactPhone",
          type: "text",
          label: "HOA management contact phone",
          visibleIf: { fieldId: "hoaExists", equals: "yes" },
        },
        {
          id: "hoaContactEmail",
          type: "text",
          label: "HOA management contact email",
          visibleIf: { fieldId: "hoaExists", equals: "yes" },
        },
      ],
    },
    {
      id: "coopDetails",
      title: "Co-op details",
      description:
        "Co-ops are the dominant ownership form in NYC. The buyer purchases shares in a housing corporation and receives a proprietary lease. Co-ops are personal property, not real property — different tax and financing rules apply.",
      items: [
        {
          id: "coopCorporationName",
          type: "text",
          label: "Housing corporation name",
          visibleIf: { fieldId: "propertyType", equals: "coop" },
        },
        {
          id: "coopShares",
          type: "number",
          label: "Number of shares allocated to unit",
          visibleIf: { fieldId: "propertyType", equals: "coop" },
        },
        {
          id: "coopMonthlyMaintenance",
          type: "currency",
          label: "Monthly maintenance",
          help: "Includes proportionate share of underlying mortgage and real estate taxes",
          visibleIf: { fieldId: "propertyType", equals: "coop" },
        },
        {
          id: "coopUnderlyingMortgage",
          type: "currency",
          label: "Co-op's underlying mortgage balance",
          visibleIf: { fieldId: "propertyType", equals: "coop" },
        },
        {
          id: "coopSubletPolicy",
          type: "text",
          label: "Sublet policy summary",
          visibleIf: { fieldId: "propertyType", equals: "coop" },
        },
        {
          id: "coopMoveInDeposit",
          type: "currency",
          label: "Move-in deposit / fee",
          visibleIf: { fieldId: "propertyType", equals: "coop" },
        },
        {
          id: "coopFinancingAllowed",
          type: "radio",
          label: "Financing permitted by building?",
          options: YES_NO,
          visibleIf: { fieldId: "propertyType", equals: "coop" },
        },
        {
          id: "coopMaxFinancingPercent",
          type: "number",
          label: "Maximum financing allowed (%)",
          placeholder: "80",
          visibleIf: { fieldId: "propertyType", equals: "coop" },
        },
      ],
    },
    {
      id: "condoDetails",
      title: "Condominium details",
      description:
        "Condo owners hold fee title to their unit and an undivided interest in common elements. Condos have a right of first refusal (ROFR); NYC condos must file with ACRIS. Common charges are separate from real estate taxes.",
      items: [
        {
          id: "condoCommonCharges",
          type: "currency",
          label: "Monthly common charges",
          visibleIf: { fieldId: "propertyType", equals: "condo" },
        },
        {
          id: "condoAssessments",
          type: "currency",
          label: "Current special assessment amount (if any)",
          visibleIf: { fieldId: "propertyType", equals: "condo" },
        },
        {
          id: "condoRofrWaived",
          type: "radio",
          label: "Right of first refusal (ROFR) waived by condo board?",
          options: YES_NO,
          visibleIf: { fieldId: "propertyType", equals: "condo" },
        },
        {
          id: "condoRofrDeadline",
          type: "date",
          label: "ROFR response deadline",
          visibleIf: { fieldId: "propertyType", equals: "condo" },
        },
        {
          id: "421aAbatement",
          type: "radio",
          label: "421-a tax abatement in place?",
          help: "NY RPL §421-a abatements reduce real estate taxes for a set term; buyer should verify remaining term and expiration",
          options: YES_NO,
        },
        {
          id: "421aExpirationDate",
          type: "date",
          label: "421-a abatement expiration date",
          visibleIf: { fieldId: "421aAbatement", equals: "yes" },
        },
      ],
    },
  ],
};
