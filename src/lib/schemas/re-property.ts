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
          id: "propertyType",
          type: "select",
          label: "Property type",
          required: true,
          options: [
            { value: "single-family", label: "Single-family residential" },
            { value: "condo", label: "Condominium" },
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
  ],
};
