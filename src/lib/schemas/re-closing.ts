import { YES_NO } from "./common";
import type { FormSchema } from "./types";

export const reClosing: FormSchema = {
  id: "re-closing",
  title: "Title & Closing",
  longTitle: "Real Estate — Title, Escrow & Closing",
  appliesTo: ["realEstate"],
  sections: [
    {
      id: "titleEscrow",
      title: "Title & escrow",
      items: [
        { id: "titleCompany", type: "text", label: "Title company name" },
        { id: "titleOfficerName", type: "text", label: "Title officer name" },
        { id: "titlePhone", type: "text", label: "Title officer phone" },
        { id: "titleEmail", type: "text", label: "Title officer email" },
        { id: "escrowCompany", type: "text", label: "Escrow company (if different)" },
        { id: "escrowOfficerName", type: "text", label: "Escrow officer name" },
        { id: "escrowPhone", type: "text", label: "Escrow officer phone" },
        { id: "escrowDepositAmount", type: "currency", label: "Escrow / earnest deposit held" },
      ],
    },
    {
      id: "closing",
      title: "Closing details",
      items: [
        { id: "closingDate", type: "date", label: "Closing date" },
        { id: "closingTime", type: "text", label: "Closing time", placeholder: "10:00 AM" },
        { id: "closingLocation", type: "text", label: "Closing location" },
        { id: "closingAttorney", type: "text", label: "Closing attorney / agent" },
        { id: "closingNotes", type: "textarea", label: "Closing notes / outstanding items" },
      ],
    },
    {
      id: "titleDetails",
      title: "Title details",
      items: [
        { id: "currentOwner", type: "text", label: "Current owner of record" },
        {
          id: "ownershipType",
          type: "select",
          label: "Ownership type",
          options: [
            { value: "individual", label: "Individual" },
            { value: "joint-tenancy", label: "Joint tenancy" },
            { value: "tenants-in-common", label: "Tenants in common" },
            { value: "trust", label: "Trust" },
            { value: "corporate", label: "Corporate / LLC" },
            { value: "other", label: "Other" },
          ],
        },
        {
          id: "knownLiens",
          type: "radio",
          label: "Are there known liens or encumbrances on the property?",
          options: YES_NO,
        },
        {
          id: "lienDetails",
          type: "textarea",
          label: "Describe known liens / encumbrances",
          visibleIf: { fieldId: "knownLiens", equals: "yes" },
        },
        {
          id: "surveyCompleted",
          type: "radio",
          label: "Has a survey been completed?",
          options: YES_NO,
        },
        {
          id: "floodZone",
          type: "radio",
          label: "Is the property in a flood zone?",
          options: YES_NO,
        },
      ],
    },
  ],
};
