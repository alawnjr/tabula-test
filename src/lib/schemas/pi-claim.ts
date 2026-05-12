import { YES_NO } from "./common";
import type { FormSchema } from "./types";

export const piClaim: FormSchema = {
  id: "pi-claim",
  title: "Claim & Demand",
  longTitle: "Personal Injury — Claim Status & Demand",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "status",
      title: "Claim status",
      items: [
        {
          id: "claimFiled",
          type: "radio",
          label: "Has a formal claim been filed with the defendant's insurer?",
          options: YES_NO,
        },
        {
          id: "claimFilingDate",
          type: "date",
          label: "Claim filing date",
          visibleIf: { fieldId: "claimFiled", equals: "yes" },
        },
        {
          id: "priorClaims",
          type: "radio",
          label: "Has the client filed prior personal injury claims?",
          options: YES_NO,
        },
        {
          id: "otherAttorney",
          type: "radio",
          label: "Is another attorney involved?",
          options: YES_NO,
        },
        {
          id: "otherAttorneyName",
          type: "text",
          label: "Other attorney name",
          visibleIf: { fieldId: "otherAttorney", equals: "yes" },
        },
      ],
    },
    {
      id: "witnesses",
      title: "Witnesses",
      items: [
        {
          kind: "repeating-group",
          id: "witnesses",
          label: "Witnesses",
          itemLabel: "Witness",
          fields: [
            { id: "witnessName", type: "text", label: "Name", required: true },
            { id: "witnessPhone", type: "text", label: "Phone" },
            { id: "witnessEmail", type: "text", label: "Email" },
            { id: "witnessRelationship", type: "text", label: "Relationship to incident" },
          ],
        },
      ],
    },
    {
      id: "demand",
      title: "Demand & settlement",
      items: [
        {
          id: "demandSent",
          type: "radio",
          label: "Has a demand letter been sent?",
          options: YES_NO,
        },
        {
          id: "demandAmount",
          type: "currency",
          label: "Demand amount",
          visibleIf: { fieldId: "demandSent", equals: "yes" },
        },
        {
          id: "demandDate",
          type: "date",
          label: "Demand letter date",
          visibleIf: { fieldId: "demandSent", equals: "yes" },
        },
        {
          id: "offerReceived",
          type: "radio",
          label: "Has a settlement offer been received?",
          options: YES_NO,
        },
        {
          id: "offerAmount",
          type: "currency",
          label: "Offer amount",
          visibleIf: { fieldId: "offerReceived", equals: "yes" },
        },
        {
          id: "offerDate",
          type: "date",
          label: "Offer date",
          visibleIf: { fieldId: "offerReceived", equals: "yes" },
        },
        {
          id: "settlementStatus",
          type: "select",
          label: "Current status",
          options: [
            { value: "investigation", label: "Under investigation" },
            { value: "treatment", label: "Client in active treatment" },
            { value: "demand-pending", label: "Demand letter pending" },
            { value: "negotiation", label: "In negotiation" },
            { value: "litigation", label: "Litigation filed" },
            { value: "settled", label: "Settled" },
            { value: "closed", label: "Closed / no recovery" },
          ],
        },
      ],
    },
  ],
};
