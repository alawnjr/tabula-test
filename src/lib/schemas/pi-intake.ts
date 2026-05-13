import { addressFields, personNameFields, US_STATES, YES_NO } from "./common";
import type { FormSchema } from "./types";

export const piIntake: FormSchema = {
  id: "pi-intake",
  title: "Client Intake",
  longTitle: "Personal Injury — Client & Incident Intake",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "client",
      title: "Client information",
      items: [
        ...personNameFields("clientName", "Client name"),
        { id: "clientDob", type: "date", label: "Date of birth" },
        ...addressFields("client"),
        { id: "clientPhone", type: "text", label: "Phone number", placeholder: "(555) 000-0000" },
        { id: "clientEmail", type: "text", label: "Email address" },
      ],
    },
    {
      id: "incident",
      title: "Incident details",
      items: [
        {
          id: "incidentType",
          type: "select",
          label: "Type of incident",
          required: true,
          options: [
            { value: "motor-vehicle", label: "Motor vehicle accident" },
            { value: "slip-fall", label: "Slip and fall" },
            { value: "dog-bite", label: "Dog bite / animal attack" },
            { value: "medical-malpractice", label: "Medical malpractice" },
            { value: "product-liability", label: "Product liability" },
            { value: "premises-liability", label: "Premises liability" },
            { value: "other", label: "Other" },
          ],
        },
        { id: "incidentDate", type: "date", label: "Date of incident", required: true },
        { id: "incidentTime", type: "text", label: "Time of incident (approximate)", placeholder: "3:30 PM" },
        { id: "incidentAddressStreet", type: "text", label: "Location — street address" },
        { id: "incidentAddressCity", type: "text", label: "Location — city" },
        {
          id: "incidentAddressState",
          type: "select",
          label: "Location — state",
          options: US_STATES,
        },
        { id: "incidentAddressZip", type: "text", label: "Location — ZIP" },
        { id: "incidentDescription", type: "textarea", label: "Description of what happened", required: true },
        {
          id: "policeReportFiled",
          type: "radio",
          label: "Was a police or incident report filed?",
          options: YES_NO,
        },
        {
          id: "policeReportNumber",
          type: "text",
          label: "Report number",
          visibleIf: { fieldId: "policeReportFiled", equals: "yes" },
        },
      ],
    },
    {
      id: "noticeOfClaim",
      title: "Notice of Claim — GML §50-e",
      description:
        "When a defendant is a NY municipal entity (city, county, school district, public authority, etc.), a Notice of Claim must be served within 90 days of the accrual of the claim (GML §50-e). Service is a prerequisite to suit. Late service requires court approval.",
      items: [
        {
          id: "municipalDefendant",
          type: "radio",
          label: "Is any defendant a NY municipal / government entity?",
          required: true,
          options: YES_NO,
        },
        {
          id: "municipalityName",
          type: "text",
          label: "Name of municipality / public entity",
          visibleIf: { fieldId: "municipalDefendant", equals: "yes" },
        },
        {
          id: "nocDeadline",
          type: "date",
          label: "Notice of Claim deadline (90 days from accrual)",
          help: "Calculate from the date of the incident (or date of discovery for infants/latent injuries)",
          visibleIf: { fieldId: "municipalDefendant", equals: "yes" },
        },
        {
          id: "nocFiled",
          type: "radio",
          label: "Notice of Claim filed?",
          options: YES_NO,
          visibleIf: { fieldId: "municipalDefendant", equals: "yes" },
        },
        {
          id: "nocFilingDate",
          type: "date",
          label: "Notice of Claim filing / service date",
          visibleIf: { fieldId: "nocFiled", equals: "yes" },
        },
        {
          id: "nocFiledWith",
          type: "text",
          label: "Filed with (comptroller's office / clerk)",
          visibleIf: { fieldId: "nocFiled", equals: "yes" },
        },
        {
          id: "nocLateApplication",
          type: "radio",
          label: "Late service — court application required (GML §50-e(5))?",
          options: YES_NO,
          visibleIf: { fieldId: "municipalDefendant", equals: "yes" },
        },
        {
          id: "fiftyHHearingScheduled",
          type: "radio",
          label: "GML §50-h examination (city hearing) scheduled?",
          help: "Municipality may demand a §50-h examination before suit is commenced; it must be completed before action can be filed",
          options: YES_NO,
          visibleIf: { fieldId: "nocFiled", equals: "yes" },
        },
        {
          id: "fiftyHHearingDate",
          type: "date",
          label: "§50-h hearing date",
          visibleIf: { fieldId: "fiftyHHearingScheduled", equals: "yes" },
        },
        {
          id: "fiftyHHearingCompleted",
          type: "radio",
          label: "§50-h hearing completed?",
          options: YES_NO,
          visibleIf: { fieldId: "fiftyHHearingScheduled", equals: "yes" },
        },
      ],
    },
  ],
};
