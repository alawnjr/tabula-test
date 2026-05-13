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
    {
      id: "nyLitigation",
      title: "NY litigation — filing & discovery",
      description:
        "NY Supreme Court is the trial court for personal injury. Cases are commenced by filing a summons with notice or summons and complaint with the county clerk. Note index number immediately — it is required on all subsequent filings.",
      items: [
        {
          id: "suitFiled",
          type: "radio",
          label: "Summons / complaint filed?",
          options: YES_NO,
        },
        {
          id: "indexNumber",
          type: "text",
          label: "Index number (e.g., 123456/2025)",
          visibleIf: { fieldId: "suitFiled", equals: "yes" },
        },
        {
          id: "court",
          type: "text",
          label: "Court (e.g., Supreme Court, New York County)",
          visibleIf: { fieldId: "suitFiled", equals: "yes" },
        },
        {
          id: "rjiFiled",
          type: "radio",
          label: "RJI (Request for Judicial Intervention) filed?",
          help: "Required to place the case on the court's calendar (22 NYCRR §202.6); typically filed within 120 days of service",
          options: YES_NO,
          visibleIf: { fieldId: "suitFiled", equals: "yes" },
        },
        {
          id: "rjiFilingDate",
          type: "date",
          label: "RJI filing date",
          visibleIf: { fieldId: "rjiFiled", equals: "yes" },
        },
        {
          id: "billOfParticularsServed",
          type: "radio",
          label: "Bill of Particulars served?",
          help: "Defendant's demand for bill of particulars must typically be responded to within 30 days (CPLR §3042)",
          options: YES_NO,
          visibleIf: { fieldId: "suitFiled", equals: "yes" },
        },
        {
          id: "billOfParticularsDate",
          type: "date",
          label: "Bill of Particulars service date",
          visibleIf: { fieldId: "billOfParticularsServed", equals: "yes" },
        },
        {
          id: "ebtScheduled",
          type: "radio",
          label: "EBT (examination before trial / deposition) scheduled?",
          options: YES_NO,
          visibleIf: { fieldId: "suitFiled", equals: "yes" },
        },
        {
          id: "ebtDate",
          type: "date",
          label: "EBT date",
          visibleIf: { fieldId: "ebtScheduled", equals: "yes" },
        },
        {
          id: "noteOfIssueFiled",
          type: "radio",
          label: "Note of Issue filed (case ready for trial)?",
          options: YES_NO,
          visibleIf: { fieldId: "suitFiled", equals: "yes" },
        },
        {
          id: "noteOfIssueDate",
          type: "date",
          label: "Note of Issue filing date",
          visibleIf: { fieldId: "noteOfIssueFiled", equals: "yes" },
        },
      ],
    },
    {
      id: "solTracking",
      title: "Statute of limitations (CPLR)",
      description:
        "NY statutes of limitations vary by claim type. Missing the SOL bars recovery. Tolling rules apply for infants (CPLR §208) and mental incapacity (CPLR §208). If defendant is a municipal entity, suit may not be commenced until 90 days after service of Notice of Claim.",
      items: [
        {
          id: "solClaimType",
          type: "select",
          label: "Primary claim type for SOL purposes",
          required: true,
          options: [
            { value: "negligence-3yr", label: "Negligence / personal injury — 3 years (CPLR §214(5))" },
            { value: "motor-vehicle-3yr", label: "Motor vehicle accident — 3 years (CPLR §214(5))" },
            { value: "medical-malpractice-2.5yr", label: "Medical malpractice — 2½ years (CPLR §214-a)" },
            { value: "wrongful-death-2yr", label: "Wrongful death — 2 years from death (EPTL §5-4.1)" },
            { value: "products-liability-3yr", label: "Products liability — 3 years (CPLR §214(5))" },
            { value: "assault-battery-1yr", label: "Assault / battery — 1 year (CPLR §215(3))" },
            { value: "municipal-1yr6mo", label: "Municipal / city defendant — 1 year 90 days (GML §50-i)" },
            { value: "infant-toll", label: "Infant plaintiff — tolled until age 18 + applicable period (CPLR §208)" },
            { value: "other", label: "Other (note below)" },
          ],
        },
        {
          id: "solDeadline",
          type: "date",
          label: "SOL deadline",
          help: "Enter the computed deadline; double-check tolling rules and any COVID extensions",
        },
        {
          id: "solNotes",
          type: "textarea",
          label: "SOL notes / tolling circumstances",
          placeholder: "Describe any tolling rules, extensions, or special circumstances affecting the deadline",
        },
      ],
    },
  ],
};
