import { addressFields, personNameFields, US_STATES, YES_NO } from "./common";
import type { FormSchema } from "./types";

export const eaDecedent: FormSchema = {
  id: "ea-decedent",
  title: "Decedent Record",
  longTitle: "Estate Administration — Decedent Record",
  appliesTo: ["estateAdmin"],
  sections: [
    {
      id: "identity",
      title: "Identity",
      items: [
        ...personNameFields("decedent", "Decedent"),
        { id: "decedentDob", type: "date", label: "Date of birth" },
        { id: "decedentDod", type: "date", label: "Date of death", required: true },
        {
          id: "deathPlaceState",
          type: "select",
          label: "Place of death — state",
          options: US_STATES,
        },
        { id: "deathPlaceCounty", type: "text", label: "Place of death — county" },
        {
          id: "deathPlaceFacility",
          type: "text",
          label: "Place of death — facility",
          placeholder: "Hospital / nursing home / residence",
        },
        { id: "decedentSsn", type: "text", label: "Social security number (full)", help: "Stored encrypted; needed for 1041 / 706." },
      ],
    },
    {
      id: "residence",
      title: "Residence at death",
      items: [
        ...addressFields("residence"),
        {
          id: "yearsAtDomicile",
          type: "number",
          label: "Years at this domicile",
          help: "Used to confirm domicile for jurisdictional purposes.",
        },
      ],
    },
    {
      id: "vitalRecords",
      title: "Vital records & post-death documents",
      items: [
        {
          id: "deathCertificateOrdered",
          type: "radio",
          label: "Certified death certificates ordered?",
          options: YES_NO,
        },
        {
          id: "deathCertificateCount",
          type: "number",
          label: "How many certified copies?",
          help: "Plan for ~2 per major asset + 4 spare.",
          visibleIf: { fieldId: "deathCertificateOrdered", equals: "yes" },
        },
        {
          id: "obituaryFiled",
          type: "radio",
          label: "Obituary published?",
          options: YES_NO,
        },
        {
          id: "obituaryUrl",
          type: "text",
          label: "Obituary URL / citation",
          visibleIf: { fieldId: "obituaryFiled", equals: "yes" },
        },
      ],
    },
    {
      id: "finalTaxes",
      title: "Decedent's final 1040",
      description:
        "The decedent's final personal income tax return (Form 1040) covers Jan 1 through date of death. Due on the normal April 15 of the year following death.",
      items: [
        {
          id: "lastFiled1040Year",
          type: "number",
          label: "Last year decedent filed 1040",
          placeholder: "2024",
        },
        {
          id: "final1040Status",
          type: "select",
          label: "Final 1040 status",
          options: [
            { value: "not-started", label: "Not started" },
            { value: "in-progress", label: "In progress" },
            { value: "filed", label: "Filed" },
          ],
        },
        {
          id: "preparerName",
          type: "text",
          label: "Preparer (CPA / firm)",
        },
      ],
    },
  ],
};
