import { personNameFields, US_STATES, YES_NO } from "./common";
import type { FormSchema } from "./types";

export const reParties: FormSchema = {
  id: "re-parties",
  title: "Parties",
  longTitle: "Real Estate — Parties to the Transaction",
  appliesTo: ["realEstate"],
  sections: [
    {
      id: "client",
      title: "Client information",
      items: [
        ...personNameFields("clientName", "Client name"),
        { id: "clientPhone", type: "text", label: "Phone number", placeholder: "(555) 000-0000" },
        { id: "clientEmail", type: "text", label: "Email address" },
        {
          id: "transactionRole",
          type: "radio",
          label: "Client's role in this transaction",
          required: true,
          options: [
            { value: "buyer", label: "Buyer" },
            { value: "seller", label: "Seller" },
            { value: "both", label: "Buyer and seller (exchange)" },
          ],
        },
        { id: "clientAddressStreet", type: "text", label: "Mailing address — street" },
        { id: "clientAddressCity", type: "text", label: "Mailing address — city" },
        { id: "clientAddressState", type: "select", label: "Mailing address — state", options: US_STATES },
        { id: "clientAddressZip", type: "text", label: "Mailing address — ZIP" },
      ],
    },
    {
      id: "otherParty",
      title: "Other party",
      description: "The buyer (if client is seller) or seller (if client is buyer).",
      items: [
        { id: "otherPartyName", type: "text", label: "Other party name" },
        { id: "otherPartyPhone", type: "text", label: "Other party phone" },
        { id: "otherPartyEmail", type: "text", label: "Other party email" },
        { id: "opposingAttorneyName", type: "text", label: "Other party's attorney name" },
        { id: "opposingAttorneyPhone", type: "text", label: "Other party's attorney phone" },
        {
          id: "isRepresented",
          type: "radio",
          label: "Is the other party represented by an attorney?",
          options: YES_NO,
        },
      ],
    },
    {
      id: "agents",
      title: "Agents & other professionals",
      items: [
        {
          kind: "repeating-group",
          id: "transactionParties",
          label: "Transaction parties",
          itemLabel: "Party",
          fields: [
            {
              id: "partyType",
              type: "select",
              label: "Role",
              required: true,
              options: [
                { value: "buyers-agent", label: "Buyer's agent" },
                { value: "listing-agent", label: "Listing agent" },
                { value: "dual-agent", label: "Dual agent" },
                { value: "mortgage-broker", label: "Mortgage broker / loan officer" },
                { value: "title-officer", label: "Title officer" },
                { value: "inspector", label: "Inspector" },
                { value: "appraiser", label: "Appraiser" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "partyName", type: "text", label: "Name", required: true },
            { id: "partyCompany", type: "text", label: "Company / firm" },
            { id: "partyPhone", type: "text", label: "Phone" },
            { id: "partyEmail", type: "text", label: "Email" },
          ],
        },
      ],
    },
  ],
};
