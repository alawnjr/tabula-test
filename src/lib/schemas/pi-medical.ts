import { US_STATES } from "./common";
import type { FormSchema } from "./types";

export const piMedical: FormSchema = {
  id: "pi-medical",
  title: "Medical Treatment",
  longTitle: "Personal Injury — Injuries & Medical Treatment",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "injuries",
      title: "Injuries sustained",
      items: [
        {
          id: "injuryDescription",
          type: "textarea",
          label: "Describe all injuries",
          required: true,
          placeholder: "List each injury sustained as a result of the incident",
        },
        { id: "firstTreatmentDate", type: "date", label: "Date of first medical treatment" },
      ],
    },
    {
      id: "providers",
      title: "Medical providers",
      description: "List every doctor, hospital, or therapist who treated the client.",
      items: [
        {
          kind: "repeating-group",
          id: "medicalProviders",
          label: "Medical providers",
          itemLabel: "Provider",
          fields: [
            { id: "providerName", type: "text", label: "Provider / facility name", required: true },
            {
              id: "providerType",
              type: "select",
              label: "Provider type",
              options: [
                { value: "hospital", label: "Hospital / ER" },
                { value: "physician", label: "Physician" },
                { value: "specialist", label: "Specialist" },
                { value: "physical-therapy", label: "Physical therapy" },
                { value: "chiropractic", label: "Chiropractic" },
                { value: "mental-health", label: "Mental health" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "providerStreet", type: "text", label: "Street address" },
            { id: "providerCity", type: "text", label: "City" },
            { id: "providerState", type: "select", label: "State", options: US_STATES },
            { id: "providerZip", type: "text", label: "ZIP" },
            { id: "providerPhone", type: "text", label: "Phone" },
            { id: "treatmentFrom", type: "date", label: "Treatment start date" },
            { id: "treatmentTo", type: "date", label: "Treatment end date (leave blank if ongoing)" },
          ],
        },
      ],
    },
    {
      id: "medications",
      title: "Medications prescribed",
      items: [
        {
          kind: "repeating-group",
          id: "medications",
          label: "Medications",
          itemLabel: "Medication",
          fields: [
            { id: "medicationName", type: "text", label: "Medication name", required: true },
            { id: "prescribingDoctor", type: "text", label: "Prescribing doctor" },
            { id: "medicationStartDate", type: "date", label: "Start date" },
            { id: "medicationEndDate", type: "date", label: "End date (leave blank if ongoing)" },
          ],
        },
      ],
    },
  ],
};
