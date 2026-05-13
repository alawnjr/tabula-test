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
    {
      id: "nyRecording",
      title: "NY deed recording & post-closing",
      description:
        "Deeds must be recorded in the county clerk's office (or via ACRIS for NYC). Recording gives constructive notice and protects the buyer's title against subsequent purchasers. Transfer documents (TP-584, RP-5217) must accompany the deed at recording.",
      items: [
        {
          id: "deedRecorded",
          type: "radio",
          label: "Deed recorded?",
          options: YES_NO,
        },
        {
          id: "deedRecordingDate",
          type: "date",
          label: "Recording date",
          visibleIf: { fieldId: "deedRecorded", equals: "yes" },
        },
        {
          id: "deedRecordingNumber",
          type: "text",
          label: "Recording / liber-page number",
          help: "Upstate counties use Liber/Page format; NYC uses ACRIS document ID",
          visibleIf: { fieldId: "deedRecorded", equals: "yes" },
        },
        {
          id: "acrisRecordingCompleted",
          type: "radio",
          label: "ACRIS e-recording completed (NYC properties)?",
          help: "Covers Manhattan, Brooklyn, Queens, and the Bronx; Staten Island uses Richmond County Clerk",
          options: YES_NO,
        },
        {
          id: "acrisDocumentId",
          type: "text",
          label: "ACRIS document ID",
          visibleIf: { fieldId: "acrisRecordingCompleted", equals: "yes" },
        },
        {
          id: "smokeCoAffidavitFiled",
          type: "radio",
          label: "Smoke / CO detector affidavit filed with deed?",
          help: "Required at recording for 1-2 family homes and individual condo units (NY Executive Law §378(5))",
          options: YES_NO,
        },
        {
          id: "tp584FiledAtRecording",
          type: "radio",
          label: "TP-584 filed with county clerk at recording?",
          options: YES_NO,
        },
        {
          id: "rp5217FiledAtRecording",
          type: "radio",
          label: "RP-5217 / RP-5217-NYC filed with county clerk at recording?",
          options: YES_NO,
        },
        {
          id: "titlePolicyIssued",
          type: "radio",
          label: "Owner's title insurance policy issued?",
          options: YES_NO,
        },
        {
          id: "titlePolicyNumber",
          type: "text",
          label: "Title policy number",
          visibleIf: { fieldId: "titlePolicyIssued", equals: "yes" },
        },
      ],
    },
  ],
};
