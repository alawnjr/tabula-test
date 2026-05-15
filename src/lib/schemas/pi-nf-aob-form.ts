import { US_STATES } from "./common";
import type { FormSchema } from "./types";

// Official NYS form: Assignment of Benefits (NF-AOB) under 11 NYCRR
// §65-3.11. Permits a health-services provider to bill the No-Fault
// carrier directly for an eligible injured person.

export const piNfAobForm: FormSchema = {
  id: "pi-nf-aob-form",
  title: "NF-AOB",
  longTitle: "Assignment of Benefits (NF-AOB) — NYS DFS",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "assignor",
      title: "1. Assignor — Eligible injured person",
      items: [
        { id: "eipName", type: "text", label: "Name of eligible injured person", required: true },
        { id: "eipDob", type: "date", label: "Date of birth" },
        { id: "eipStreet", type: "text", label: "Mailing address" },
        { id: "eipCity", type: "text", label: "City" },
        { id: "eipState", type: "select", label: "State", options: US_STATES },
        { id: "eipZip", type: "text", label: "ZIP code" },
        { id: "eipPhone", type: "text", label: "Telephone" },
        { id: "dateOfAccident", type: "date", label: "Date of accident" },
        { id: "insurerName", type: "text", label: "No-Fault carrier" },
        { id: "claimNumber", type: "text", label: "Claim number" },
        { id: "policyNumber", type: "text", label: "Policy number" },
      ],
    },
    {
      id: "assignee",
      title: "2. Assignee — Provider of health services",
      items: [
        { id: "providerName", type: "text", label: "Provider / facility name", required: true },
        { id: "providerNpi", type: "text", label: "NPI" },
        { id: "providerTin", type: "text", label: "Tax ID / EIN" },
        { id: "providerStreet", type: "text", label: "Address" },
        { id: "providerCity", type: "text", label: "City" },
        { id: "providerState", type: "select", label: "State", options: US_STATES },
        { id: "providerZip", type: "text", label: "ZIP code" },
        { id: "providerPhone", type: "text", label: "Telephone" },
      ],
    },
    {
      id: "assignment",
      title: "3. Assignment language",
      description:
        "I, the undersigned assignor, hereby assign to the above provider all rights, privileges and remedies to payment for health-care services rendered as a result of the above motor vehicle accident, to which I am entitled under Article 51 (the No-Fault statute) of the New York Insurance Law.",
      items: [
        {
          id: "scope",
          type: "select",
          label: "Scope of assignment",
          options: [
            { value: "all-services", label: "All services rendered for the accident" },
            { value: "specific", label: "Specific dates of service only (list below)" },
          ],
        },
        {
          id: "specificDates",
          type: "textarea",
          label: "Specific dates of service",
          visibleIf: { fieldId: "scope", equals: "specific" },
        },
      ],
    },
    {
      id: "covenants",
      title: "4. Covenant not to pursue",
      description:
        "The assignor will not pursue the carrier for the assigned benefits, and the provider may not pursue the assignor except for amounts not paid because of failure to comply with policy conditions.",
      items: [
        { id: "covenantAcknowledged", type: "checkbox", label: "Assignor acknowledges covenant" },
      ],
    },
    {
      id: "signatures",
      title: "5. Signatures",
      items: [
        { id: "assignorSignature", type: "text", label: "Assignor signature (typed)" },
        { id: "assignorSignDate", type: "date", label: "Date signed" },
        { id: "witnessSignature", type: "text", label: "Witness signature (typed)" },
        { id: "witnessSignDate", type: "date", label: "Witness date" },
        { id: "providerSignatory", type: "text", label: "Provider representative (typed)" },
        { id: "providerSignDate", type: "date", label: "Date" },
      ],
    },
  ],
};
