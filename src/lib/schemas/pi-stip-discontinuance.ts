import { YES_NO } from "./common";
import type { FormSchema } from "./types";

// Stipulation of Discontinuance — CPLR §3217(a).
// A standardized template; once filed and signed by all parties who
// have appeared, the action is discontinued without further court order.

export const piStipDiscontinuance: FormSchema = {
  id: "pi-stip-discontinuance",
  title: "Stip. of Discontinuance",
  longTitle: "Stipulation of Discontinuance — CPLR §3217",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "caption",
      title: "1. Caption",
      items: [
        { id: "courtName", type: "text", label: "Court", required: true, placeholder: "Supreme Court of the State of New York" },
        { id: "courtCounty", type: "text", label: "County", required: true },
        { id: "indexNumber", type: "text", label: "Index number", required: true },
        { id: "captionPlaintiff", type: "text", label: "Plaintiff(s)", required: true },
        { id: "captionDefendant", type: "text", label: "Defendant(s)", required: true },
      ],
    },
    {
      id: "scope",
      title: "2. Scope of discontinuance",
      items: [
        {
          id: "discontinuanceScope",
          type: "select",
          label: "Discontinuance",
          required: true,
          options: [
            { value: "entire", label: "Entire action" },
            { value: "specific-defendant", label: "As to specific defendant(s) only" },
            { value: "specific-claim", label: "As to specific claim(s) only" },
          ],
        },
        {
          id: "discontinuedDefendants",
          type: "text",
          label: "Defendant(s) discontinued",
          visibleIf: { fieldId: "discontinuanceScope", equals: "specific-defendant" },
        },
        {
          id: "discontinuedClaims",
          type: "textarea",
          label: "Claim(s) discontinued",
          visibleIf: { fieldId: "discontinuanceScope", equals: "specific-claim" },
        },
        {
          id: "withOrWithoutPrejudice",
          type: "radio",
          label: "Discontinuance is",
          required: true,
          options: [
            { value: "with-prejudice", label: "With prejudice" },
            { value: "without-prejudice", label: "Without prejudice" },
          ],
        },
        {
          id: "withCostsTo",
          type: "select",
          label: "Costs",
          options: [
            { value: "no-costs", label: "Without costs to any party" },
            { value: "plaintiff", label: "With costs to plaintiff" },
            { value: "defendant", label: "With costs to defendant" },
          ],
        },
      ],
    },
    {
      id: "settlement",
      title: "3. Settlement notes (if applicable)",
      items: [
        { id: "settlementReached", type: "radio", label: "Filed pursuant to settlement?", options: YES_NO },
        { id: "settlementAmount", type: "currency", label: "Settlement amount", visibleIf: { fieldId: "settlementReached", equals: "yes" } },
        { id: "releaseExchanged", type: "radio", label: "General release exchanged?", options: YES_NO, visibleIf: { fieldId: "settlementReached", equals: "yes" } },
        { id: "settlementNotes", type: "textarea", label: "Notes (escrow, lien resolution, etc.)" },
      ],
    },
    {
      id: "signatures",
      title: "4. Signatures of counsel",
      description:
        "Stipulation must be signed by attorneys of record for all parties who have appeared. Pro-se parties sign themselves.",
      items: [
        {
          kind: "repeating-group",
          id: "signatories",
          label: "Signatories",
          itemLabel: "Counsel",
          minItems: 2,
          fields: [
            { id: "role", type: "select", label: "Role", options: [
              { value: "plaintiff", label: "Counsel for plaintiff" },
              { value: "defendant", label: "Counsel for defendant" },
              { value: "third-party-plaintiff", label: "Counsel for third-party plaintiff" },
              { value: "third-party-defendant", label: "Counsel for third-party defendant" },
              { value: "pro-se", label: "Pro-se party" },
            ] },
            { id: "partyRepresented", type: "text", label: "Party represented" },
            { id: "attorneyName", type: "text", label: "Attorney / signer (typed)" },
            { id: "firmName", type: "text", label: "Firm name" },
            { id: "firmAddress", type: "text", label: "Address" },
            { id: "firmPhone", type: "text", label: "Telephone" },
            { id: "attorneyRegNo", type: "text", label: "Attorney registration number" },
            { id: "signatureDate", type: "date", label: "Date signed" },
          ],
        },
      ],
    },
    {
      id: "filing",
      title: "5. Filing",
      items: [
        { id: "filingDate", type: "date", label: "Date filed with County Clerk" },
        { id: "filedBy", type: "text", label: "Filed by (attorney / firm)" },
        { id: "filerEmail", type: "text", label: "Filer email" },
      ],
    },
  ],
};
