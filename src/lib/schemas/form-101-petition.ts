import {
  addressFields,
  MONEY_RANGES,
  personNameFields,
  RANGE_OPTIONS,
  YES_NO,
} from "./common";
import type { FormSchema } from "./types";

export const form101: FormSchema = {
  id: "101",
  title: "Voluntary Petition",
  longTitle: "Form 101 — Voluntary Petition for Individuals Filing for Bankruptcy",
  appliesTo: ["chapter7", "chapter13"],
  sections: [
    {
      id: "debtor1",
      title: "Debtor 1",
      description: "Identify yourself.",
      items: [
        ...personNameFields("debtor1Name"),
        {
          id: "debtor1OtherNames",
          type: "textarea",
          label: "All other names used in the last 8 years",
          help: "Include married, maiden, business, and trade names.",
        },
        {
          id: "debtor1SsnLast4",
          type: "text",
          label: "Last 4 digits of SSN or ITIN",
          placeholder: "1234",
        },
        {
          id: "debtor1Ein",
          type: "text",
          label: "Employer Identification Number (if any)",
        },
      ],
    },
    {
      id: "debtor2",
      title: "Debtor 2 (spouse, if filing jointly)",
      description: "Leave blank if filing alone.",
      items: [
        ...personNameFields("debtor2Name"),
        {
          id: "debtor2OtherNames",
          type: "textarea",
          label: "All other names used in the last 8 years",
        },
        {
          id: "debtor2SsnLast4",
          type: "text",
          label: "Last 4 digits of SSN or ITIN",
        },
        {
          id: "debtor2Ein",
          type: "text",
          label: "Employer Identification Number (if any)",
        },
      ],
    },
    {
      id: "residence",
      title: "Where you live",
      items: [
        ...addressFields("residence"),
        { id: "residenceCounty", type: "text", label: "County" },
        {
          id: "mailingDifferent",
          type: "checkbox",
          label: "My mailing address is different from where I live",
        },
        ...addressFields("mailing").map((f) => ({
          ...f,
          visibleIf: { fieldId: "mailingDifferent", equals: true },
        })),
      ],
    },
    {
      id: "venue",
      title: "Why you chose this district",
      items: [
        {
          id: "venueReason",
          type: "radio",
          label: "Reason this is the correct venue",
          options: [
            { value: "180days", label: "I have lived in this district for the past 180 days" },
            { value: "longerThan", label: "I lived here longer than in any other district" },
            { value: "other", label: "Other reason (explain below)" },
          ],
        },
        {
          id: "venueOther",
          type: "textarea",
          label: "Explanation",
          visibleIf: { fieldId: "venueReason", equals: "other" },
        },
      ],
    },
    {
      id: "chapter",
      title: "Chapter under which you are filing",
      items: [
        {
          id: "chapterChoice",
          type: "radio",
          label: "Chapter",
          required: true,
          options: [
            { value: "chapter7", label: "Chapter 7" },
            { value: "chapter11", label: "Chapter 11" },
            { value: "chapter12", label: "Chapter 12" },
            { value: "chapter13", label: "Chapter 13" },
          ],
        },
        {
          id: "debtNature",
          type: "radio",
          label: "Nature of your debts",
          options: [
            { value: "consumer", label: "Primarily consumer debts" },
            { value: "business", label: "Primarily business debts" },
          ],
        },
      ],
    },
    {
      id: "estimates",
      title: "Estimated assets, liabilities, creditors",
      items: [
        {
          id: "estCreditors",
          type: "select",
          label: "Estimated number of creditors",
          options: RANGE_OPTIONS,
        },
        {
          id: "estAssets",
          type: "select",
          label: "Estimated assets",
          options: MONEY_RANGES,
        },
        {
          id: "estLiabilities",
          type: "select",
          label: "Estimated liabilities",
          options: MONEY_RANGES,
        },
      ],
    },
    {
      id: "priorCases",
      title: "Bankruptcy cases filed in the last 8 years",
      items: [
        {
          kind: "repeating-group",
          id: "priorCases",
          label: "Prior cases",
          itemLabel: "Prior case",
          fields: [
            { id: "district", type: "text", label: "District" },
            { id: "caseNumber", type: "text", label: "Case number" },
            { id: "filedDate", type: "date", label: "Date filed" },
          ],
        },
      ],
    },
    {
      id: "pendingAffiliate",
      title: "Pending bankruptcy by spouse, partner, or affiliate",
      items: [
        {
          id: "hasPendingAffiliate",
          type: "radio",
          label: "Is a pending case held by a spouse, partner, or affiliate?",
          options: YES_NO,
        },
        {
          id: "pendingDebtorName",
          type: "text",
          label: "Debtor name",
          visibleIf: { fieldId: "hasPendingAffiliate", equals: "yes" },
        },
        {
          id: "pendingRelationship",
          type: "text",
          label: "Relationship to you",
          visibleIf: { fieldId: "hasPendingAffiliate", equals: "yes" },
        },
        {
          id: "pendingDistrict",
          type: "text",
          label: "District",
          visibleIf: { fieldId: "hasPendingAffiliate", equals: "yes" },
        },
        {
          id: "pendingCaseNumber",
          type: "text",
          label: "Case number",
          visibleIf: { fieldId: "hasPendingAffiliate", equals: "yes" },
        },
      ],
    },
    {
      id: "rentalEviction",
      title: "Rental property and eviction",
      items: [
        {
          id: "landlordHasJudgment",
          type: "radio",
          label: "Does your landlord have a judgment for possession of your residence?",
          options: YES_NO,
        },
        {
          id: "landlordName",
          type: "text",
          label: "Landlord name",
          visibleIf: { fieldId: "landlordHasJudgment", equals: "yes" },
        },
        ...addressFields("landlord").map((f) => ({
          ...f,
          visibleIf: { fieldId: "landlordHasJudgment", equals: "yes" },
        })),
      ],
    },
    {
      id: "credentialing",
      title: "Credit-counseling certificate",
      items: [
        {
          id: "creditCounselingStatus",
          type: "radio",
          label: "Credit counseling briefing in the 180 days before filing",
          options: [
            { value: "received", label: "I received a briefing from an approved agency" },
            { value: "exigent", label: "Exigent circumstances merit a 30-day extension" },
            { value: "incapacity", label: "Exempt due to incapacity, disability, or active military duty" },
            { value: "noApproved", label: "U.S. Trustee has determined no approved agencies serve this district" },
          ],
        },
        {
          id: "creditCounselingDate",
          type: "date",
          label: "Date of briefing",
          visibleIf: { fieldId: "creditCounselingStatus", equals: "received" },
        },
        {
          id: "creditCounselingAgency",
          type: "text",
          label: "Name of approved agency",
          visibleIf: { fieldId: "creditCounselingStatus", equals: "received" },
        },
      ],
    },
    {
      id: "signature",
      title: "Signature",
      items: [
        {
          id: "signedUnderPenalty",
          type: "checkbox",
          label:
            "I declare under penalty of perjury that the information provided is true and correct.",
        },
        { id: "signedDate", type: "date", label: "Date signed" },
      ],
    },
  ],
};
