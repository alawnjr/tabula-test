import type { FormSchema } from "./types";

// CPLR §305 — Summons (and §305(b) Summons with Notice).
// Standardized header / formal-language template; the body of the
// complaint remains custom.

export const piSummons: FormSchema = {
  id: "pi-summons",
  title: "Summons (CPLR §305)",
  longTitle: "Summons / Summons with Notice — CPLR §305",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "caption",
      title: "1. Caption",
      items: [
        { id: "courtName", type: "text", label: "Court", required: true, placeholder: "Supreme Court of the State of New York" },
        { id: "courtCounty", type: "text", label: "County", required: true },
        { id: "indexNumber", type: "text", label: "Index number" },
        { id: "indexPurchaseDate", type: "date", label: "Index purchase date" },
        {
          kind: "repeating-group",
          id: "plaintiffs",
          label: "Plaintiff(s)",
          itemLabel: "Plaintiff",
          minItems: 1,
          fields: [
            { id: "name", type: "text", label: "Name (or 'A.B., an infant, by C.D., his mother and natural guardian')" },
          ],
        },
        {
          kind: "repeating-group",
          id: "defendants",
          label: "Defendant(s)",
          itemLabel: "Defendant",
          minItems: 1,
          fields: [
            { id: "name", type: "text", label: "Name (use 'John Doe' if identity unknown)" },
          ],
        },
      ],
    },
    {
      id: "form",
      title: "2. Form of summons",
      items: [
        {
          id: "summonsForm",
          type: "select",
          label: "Summons form",
          required: true,
          options: [
            { value: "with-complaint", label: "Summons (served with verified complaint)" },
            { value: "with-notice", label: "Summons with Notice — CPLR §305(b)" },
          ],
        },
        {
          id: "notice",
          type: "textarea",
          label: "Notice (required for Summons with Notice — CPLR §305(b))",
          help: "Must state object of action, relief sought, and sum of money for which judgment will be taken on default.",
          visibleIf: { fieldId: "summonsForm", equals: "with-notice" },
        },
        { id: "amountDemanded", type: "currency", label: "Sum of money for which judgment will be taken on default (CPLR §3017(c) bars stating an amount in PI complaints, but it is required on a default summons-with-notice)" },
      ],
    },
    {
      id: "venue",
      title: "3. Basis of venue (CPLR §503 / §504)",
      items: [
        {
          id: "venueBasis",
          type: "select",
          label: "Basis of venue",
          required: true,
          options: [
            { value: "plaintiff-residence", label: "Plaintiff's residence at commencement (CPLR §503(a))" },
            { value: "defendant-residence", label: "Defendant's residence" },
            { value: "place-of-occurrence", label: "Place where cause of action arose" },
            { value: "municipal", label: "Municipal defendant — CPLR §504" },
            { value: "contract", label: "Contractual designation" },
          ],
        },
        { id: "venueCounty", type: "text", label: "Venue county", required: true },
        { id: "venueAddress", type: "text", label: "Address establishing venue" },
      ],
    },
    {
      id: "service",
      title: "4. Service & response time",
      items: [
        { id: "serviceDeadlineDate", type: "date", label: "Service deadline (CPLR §306-b — 120 days from filing)" },
        {
          id: "responseTime",
          type: "select",
          label: "Time to appear / answer",
          options: [
            { value: "20-days", label: "20 days — personal delivery within NY (CPLR §320)" },
            { value: "30-days", label: "30 days — any other method or out-of-state" },
          ],
        },
      ],
    },
    {
      id: "attorney",
      title: "5. Plaintiff's attorney",
      items: [
        { id: "attorneyName", type: "text", label: "Attorney name (typed for signature)", required: true },
        { id: "firmName", type: "text", label: "Firm name" },
        { id: "firmStreet", type: "text", label: "Office address — street" },
        { id: "firmCity", type: "text", label: "City" },
        { id: "firmState", type: "text", label: "State" },
        { id: "firmZip", type: "text", label: "ZIP" },
        { id: "firmPhone", type: "text", label: "Telephone" },
        { id: "firmEmail", type: "text", label: "Email" },
        { id: "attorneyRegNo", type: "text", label: "Attorney registration number" },
        { id: "signatureDate", type: "date", label: "Date signed" },
      ],
    },
    {
      id: "defendantsAddresses",
      title: "6. Defendants — addresses for service",
      items: [
        {
          kind: "repeating-group",
          id: "defendantsServiceList",
          label: "Defendants — service addresses",
          itemLabel: "Defendant",
          fields: [
            { id: "name", type: "text", label: "Name" },
            { id: "street", type: "text", label: "Street" },
            { id: "city", type: "text", label: "City" },
            { id: "state", type: "text", label: "State" },
            { id: "zip", type: "text", label: "ZIP" },
            { id: "serviceMethod", type: "select", label: "Service method (CPLR §308)", options: [
              { value: "personal", label: "Personal delivery — §308(1)" },
              { value: "deliver-and-mail", label: "Deliver-and-mail to suitable age — §308(2)" },
              { value: "agent", label: "Agent — §308(3)" },
              { value: "nail-and-mail", label: "Nail-and-mail — §308(4)" },
              { value: "alternate", label: "Alternate / court-ordered — §308(5)" },
              { value: "secretary-of-state", label: "Secretary of State (BCL §306 / VTL §253)" },
            ] },
          ],
        },
      ],
    },
  ],
};
