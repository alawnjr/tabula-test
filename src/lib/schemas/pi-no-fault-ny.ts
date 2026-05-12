import { YES_NO } from "./common";
import type { FormSchema } from "./types";

export const piNoFaultNy: FormSchema = {
  id: "pi-no-fault-ny",
  title: "No-Fault & Serious Injury (NY)",
  longTitle: "New York No-Fault Insurance (NF-2) & Serious Injury Threshold",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "nf2",
      title: "No-Fault application (NF-2)",
      description:
        "NY Insurance Law §5102 requires filing NF-2 within 30 days of the accident. Late filing may be accepted only with documented extraordinary circumstances.",
      items: [
        {
          id: "nfApplicable",
          type: "radio",
          label: "Is this a motor vehicle accident subject to NY No-Fault (PIP)?",
          required: true,
          options: YES_NO,
        },
        {
          id: "nf2Filed",
          type: "radio",
          label: "NF-2 application filed?",
          options: YES_NO,
          visibleIf: { fieldId: "nfApplicable", equals: "yes" },
        },
        {
          id: "nf2FilingDate",
          type: "date",
          label: "NF-2 filing date",
          visibleIf: { fieldId: "nf2Filed", equals: "yes" },
        },
        {
          id: "nf2Deadline",
          type: "date",
          label: "NF-2 deadline (30 days from accident)",
          help: "Enter the 30-day deadline from the accident date",
          visibleIf: { fieldId: "nfApplicable", equals: "yes" },
        },
        {
          id: "nfInsuranceCompany",
          type: "text",
          label: "No-Fault carrier (client's own insurer)",
          visibleIf: { fieldId: "nfApplicable", equals: "yes" },
        },
        {
          id: "nfClaimNumber",
          type: "text",
          label: "No-Fault claim number",
          visibleIf: { fieldId: "nfApplicable", equals: "yes" },
        },
        {
          id: "nfBenefitsApproved",
          type: "radio",
          label: "No-Fault benefits approved?",
          options: YES_NO,
          visibleIf: { fieldId: "nf2Filed", equals: "yes" },
        },
        {
          id: "nfDenialReceived",
          type: "radio",
          label: "No-Fault denial received?",
          options: YES_NO,
          visibleIf: { fieldId: "nf2Filed", equals: "yes" },
        },
        {
          id: "nfDenialDate",
          type: "date",
          label: "Denial date",
          visibleIf: { fieldId: "nfDenialReceived", equals: "yes" },
        },
        {
          id: "nfDenialReason",
          type: "textarea",
          label: "Denial reason",
          visibleIf: { fieldId: "nfDenialReceived", equals: "yes" },
        },
        {
          id: "nfBenefitsTotal",
          type: "currency",
          label: "Total no-fault benefits received to date",
          help: "Max coverage is $50,000 for basic economic loss",
          visibleIf: { fieldId: "nfBenefitsApproved", equals: "yes" },
        },
      ],
    },
    {
      id: "seriousInjury",
      title: "Serious injury threshold — §5102(d)",
      description:
        "To pursue a tort claim for a NY motor vehicle accident, the injury must meet at least one of the nine categories under Insurance Law §5102(d).",
      items: [
        {
          id: "siCategory",
          type: "select",
          label: "Primary serious injury category",
          required: true,
          options: [
            { value: "death", label: "Death" },
            { value: "dismemberment", label: "Dismemberment" },
            { value: "significant-disfigurement", label: "Significant disfigurement" },
            { value: "fracture", label: "Fracture" },
            { value: "loss-of-fetus", label: "Loss of fetus" },
            { value: "permanent-loss-of-use", label: "Permanent loss of use of organ/member/function/system" },
            { value: "permanent-consequential-limitation", label: "Permanent consequential limitation of organ/member" },
            { value: "significant-limitation", label: "Significant limitation of body function/system" },
            { value: "90-180-day", label: "90/180-day rule — medically determined injury preventing normal activities" },
            { value: "not-applicable", label: "N/A — not a motor vehicle accident" },
          ],
        },
        {
          id: "si90of180Notes",
          type: "textarea",
          label: "90/180-day rule details",
          help: "Describe how the injury prevented substantially all usual activities for ≥90 of the 180 days following the accident",
          visibleIf: { fieldId: "siCategory", equals: "90-180-day" },
        },
        {
          id: "siNarrative",
          type: "textarea",
          label: "Serious injury supporting narrative",
          help: "Describe the medical evidence supporting the serious injury categorization",
        },
        {
          id: "imeScheduled",
          type: "radio",
          label: "Independent Medical Exam (IME) scheduled by insurer?",
          options: YES_NO,
        },
        {
          id: "imeDate",
          type: "date",
          label: "IME date",
          visibleIf: { fieldId: "imeScheduled", equals: "yes" },
        },
        {
          id: "imeDoctor",
          type: "text",
          label: "IME doctor / facility",
          visibleIf: { fieldId: "imeScheduled", equals: "yes" },
        },
        {
          id: "imeFindings",
          type: "textarea",
          label: "IME findings / notes",
          visibleIf: { fieldId: "imeScheduled", equals: "yes" },
        },
      ],
    },
    {
      id: "mv104",
      title: "MV-104 accident report",
      description:
        "NY requires an MV-104 within 10 days when an accident involves injury, death, or property damage exceeding $1,000. Failure to file may result in license suspension.",
      items: [
        {
          id: "mv104Required",
          type: "radio",
          label: "MV-104 filing required?",
          options: YES_NO,
        },
        {
          id: "mv104Filed",
          type: "radio",
          label: "MV-104 filed?",
          options: YES_NO,
          visibleIf: { fieldId: "mv104Required", equals: "yes" },
        },
        {
          id: "mv104FilingDate",
          type: "date",
          label: "MV-104 filing date",
          visibleIf: { fieldId: "mv104Filed", equals: "yes" },
        },
        {
          id: "mv104Number",
          type: "text",
          label: "MV-104 confirmation / DMV reference number",
          visibleIf: { fieldId: "mv104Filed", equals: "yes" },
        },
        {
          id: "policeReportNumber",
          type: "text",
          label: "Police report number (MV-104A)",
        },
      ],
    },
  ],
};
