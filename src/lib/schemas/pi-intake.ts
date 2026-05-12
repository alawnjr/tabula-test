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
  ],
};
