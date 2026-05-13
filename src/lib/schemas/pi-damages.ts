import { YES_NO } from "./common";
import type { FormSchema } from "./types";

export const piDamages: FormSchema = {
  id: "pi-damages",
  title: "Damages & Losses",
  longTitle: "Personal Injury — Damages & Economic Losses",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "employment",
      title: "Lost income",
      description: "Complete if the client missed work or lost income due to the injuries.",
      items: [
        { id: "employerName", type: "text", label: "Employer name" },
        { id: "jobTitle", type: "text", label: "Job title / occupation" },
        { id: "hoursPerWeek", type: "number", label: "Hours worked per week" },
        { id: "hourlyRate", type: "currency", label: "Hourly rate (or annual salary)" },
        { id: "missedDaysFrom", type: "date", label: "Missed work — from" },
        { id: "missedDaysTo", type: "date", label: "Missed work — to" },
        { id: "totalLostWages", type: "currency", label: "Total lost wages to date" },
        { id: "futureLostWages", type: "currency", label: "Estimated future lost wages / lost earning capacity" },
      ],
    },
    {
      id: "financial",
      title: "Medical & other damages",
      items: [
        { id: "totalMedicalBills", type: "currency", label: "Total medical bills to date" },
        { id: "estimatedFutureMedical", type: "currency", label: "Estimated future medical costs" },
        { id: "propertyDamage", type: "currency", label: "Property damage (e.g., vehicle repair)" },
        {
          id: "painAndSuffering",
          type: "textarea",
          label: "Notes on pain, suffering, and non-economic damages",
          placeholder: "Describe the impact on the client's daily life, activities, and well-being",
        },
      ],
    },
    {
      id: "liens",
      title: "Liens & reimbursement obligations",
      description:
        "NY requires disclosure and resolution of statutory liens before distributing settlement proceeds. Workers' comp liens (WCL §29) and Medicare / Medicaid liens must be satisfied or negotiated. Failure to address liens can expose counsel to personal liability.",
      items: [
        {
          id: "wcLienExists",
          type: "radio",
          label: "Workers' compensation lien (WCL §29)?",
          help: "Employer / carrier may assert a lien against the third-party recovery for benefits paid. Must notify carrier of suit (WCL §29(2)). Net recovery after expenses is split between claimant and carrier.",
          options: YES_NO,
        },
        {
          id: "wcCarrier",
          type: "text",
          label: "Workers' comp carrier / self-insured",
          visibleIf: { fieldId: "wcLienExists", equals: "yes" },
        },
        {
          id: "wcBenefitsPaid",
          type: "currency",
          label: "Workers' comp benefits paid to date",
          visibleIf: { fieldId: "wcLienExists", equals: "yes" },
        },
        {
          id: "wcLienAmount",
          type: "currency",
          label: "Workers' comp lien amount claimed",
          visibleIf: { fieldId: "wcLienExists", equals: "yes" },
        },
        {
          id: "wcLienResolved",
          type: "radio",
          label: "WCL §29 lien resolved / negotiated?",
          options: YES_NO,
          visibleIf: { fieldId: "wcLienExists", equals: "yes" },
        },
        {
          id: "medicareLienExists",
          type: "radio",
          label: "Medicare lien (MSP — Medicare Secondary Payer)?",
          help: "CMS must be notified and reimbursed for conditional payments. Request a MSPRC final demand before distributing settlement.",
          options: YES_NO,
        },
        {
          id: "medicareLienAmount",
          type: "currency",
          label: "Medicare conditional payment / lien amount",
          visibleIf: { fieldId: "medicareLienExists", equals: "yes" },
        },
        {
          id: "medicareLienResolved",
          type: "radio",
          label: "Medicare lien resolved / final demand received?",
          options: YES_NO,
          visibleIf: { fieldId: "medicareLienExists", equals: "yes" },
        },
        {
          id: "medicaidLienExists",
          type: "radio",
          label: "Medicaid lien (NY Social Services Law §104-b)?",
          options: YES_NO,
        },
        {
          id: "medicaidLienAmount",
          type: "currency",
          label: "Medicaid lien amount",
          visibleIf: { fieldId: "medicaidLienExists", equals: "yes" },
        },
        {
          id: "medicaidLienResolved",
          type: "radio",
          label: "Medicaid lien resolved?",
          options: YES_NO,
          visibleIf: { fieldId: "medicaidLienExists", equals: "yes" },
        },
        {
          id: "otherLiens",
          type: "textarea",
          label: "Other liens / reimbursement obligations",
          placeholder: "e.g., health insurer subrogation, disability carrier, ERISA plan",
        },
      ],
    },
  ],
};
