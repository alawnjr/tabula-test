import type { FormSchema } from "./types";

export const piInsurance: FormSchema = {
  id: "pi-insurance",
  title: "Insurance",
  longTitle: "Personal Injury — Insurance Information",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "defendantInsurance",
      title: "Defendant / at-fault party insurance",
      items: [
        { id: "defInsuranceCompany", type: "text", label: "Insurance company" },
        { id: "defPolicyNumber", type: "text", label: "Policy number" },
        { id: "defClaimNumber", type: "text", label: "Claim number (if assigned)" },
        { id: "defPolicyLimits", type: "currency", label: "Known policy limits" },
        { id: "defAdjusterName", type: "text", label: "Adjuster name" },
        { id: "defAdjusterPhone", type: "text", label: "Adjuster phone" },
        { id: "defAdjusterEmail", type: "text", label: "Adjuster email" },
      ],
    },
    {
      id: "clientInsurance",
      title: "Client's own coverage",
      items: [
        { id: "ownAutoCarrier", type: "text", label: "Auto insurance carrier" },
        { id: "ownAutoPolicyNumber", type: "text", label: "Auto policy number" },
        { id: "ownHealthCarrier", type: "text", label: "Health insurance carrier" },
        { id: "ownHealthPolicyNumber", type: "text", label: "Health policy number" },
        { id: "umUimCoverage", type: "checkbox", label: "Has uninsured / underinsured motorist (UM/UIM) coverage" },
        { id: "umUimLimits", type: "currency", label: "UM/UIM policy limits" },
        { id: "medPayCoverage", type: "checkbox", label: "Has MedPay / PIP coverage" },
        { id: "medPayLimits", type: "currency", label: "MedPay / PIP limits" },
      ],
    },
  ],
};
