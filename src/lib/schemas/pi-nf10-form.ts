import { US_STATES, YES_NO } from "./common";
import type { FormSchema } from "./types";

// Official NYS form: Denial of Claim Form (NF-10) — issued by the insurer.
// Attorneys reproduce this form when challenging a denial (AAA arbitration
// or §5106 lawsuit). All boxes mirror the official PDF.

export const piNf10Form: FormSchema = {
  id: "pi-nf10-form",
  title: "NF-10",
  longTitle: "Denial of Claim Form (NF-10) — NYS DFS",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "header",
      title: "1. Insurer / claim identifiers",
      items: [
        { id: "insurerName", type: "text", label: "Insurer name", required: true },
        { id: "insurerAddress", type: "text", label: "Insurer address" },
        { id: "claimRep", type: "text", label: "Claim representative" },
        { id: "claimRepPhone", type: "text", label: "Telephone" },
        { id: "insurerClaimNumber", type: "text", label: "Insurer claim number" },
        { id: "policyNumber", type: "text", label: "Policy number" },
        { id: "policyholderName", type: "text", label: "Policyholder name" },
        { id: "dateOfAccident", type: "date", label: "Date of accident" },
      ],
    },
    {
      id: "parties",
      title: "2. Eligible injured person / applicant",
      items: [
        { id: "eipName", type: "text", label: "Eligible injured person", required: true },
        { id: "eipDob", type: "date", label: "Date of birth" },
        { id: "applicantName", type: "text", label: "Applicant for benefits (if different — e.g., assignee provider)" },
        { id: "applicantStreet", type: "text", label: "Applicant address" },
        { id: "applicantCity", type: "text", label: "City" },
        { id: "applicantState", type: "select", label: "State", options: US_STATES },
        { id: "applicantZip", type: "text", label: "ZIP code" },
        { id: "attorney", type: "text", label: "Applicant's attorney (if any)" },
      ],
    },
    {
      id: "denial",
      title: "3. Notice of denial",
      description:
        "Box 6 categories on the NF-10. Check all that apply; a denial must be issued within 30 days of receipt of proof of claim (11 NYCRR §65-3.8).",
      items: [
        {
          id: "denyType",
          type: "select",
          label: "Type of denial",
          required: true,
          options: [
            { value: "full", label: "Denied in full" },
            { value: "partial", label: "Denied in part" },
            { value: "delay", label: "Delay — request for verification pending" },
          ],
        },
        { id: "denyDateOfService", type: "date", label: "Service / treatment date denied" },
        { id: "denyAmountBilled", type: "currency", label: "Amount billed" },
        { id: "denyAmountPaid", type: "currency", label: "Amount paid" },
        { id: "denyAmountDenied", type: "currency", label: "Amount denied" },
        { id: "denyFeeSchedule", type: "checkbox", label: "Denied — fee schedule reduction" },
        { id: "denyLackOfMedicalNecessity", type: "checkbox", label: "Denied — not medically necessary (peer review / IME)" },
        { id: "denyLateNotice", type: "checkbox", label: "Denied — late notice (NF-2 / notice of treatment not timely)" },
        { id: "denyNonCooperation", type: "checkbox", label: "Denied — failure to appear / cooperate" },
        { id: "denyPolicyExhausted", type: "checkbox", label: "Denied — policy benefits exhausted" },
        { id: "denyNotCovered", type: "checkbox", label: "Denied — not a covered person / vehicle" },
        { id: "denyMissingBills", type: "checkbox", label: "Denied — verification outstanding" },
        { id: "denyOther", type: "checkbox", label: "Denied — other (explain)" },
        { id: "denyReason", type: "textarea", label: "Factual / medical basis of denial", required: true },
        { id: "peerReviewerName", type: "text", label: "Peer reviewer / IME doctor name" },
        { id: "peerReviewDate", type: "date", label: "Date of peer review / IME report" },
      ],
    },
    {
      id: "verification",
      title: "4. Verification requested but not provided",
      items: [
        { id: "verificationRequested1Date", type: "date", label: "First verification request — date" },
        { id: "verificationRequested1Description", type: "text", label: "Description of items requested" },
        { id: "verificationRequested2Date", type: "date", label: "Follow-up verification request — date" },
        { id: "verificationReceivedDate", type: "date", label: "Date verification received (if any)" },
      ],
    },
    {
      id: "rights",
      title: "5. Notice of rights",
      description:
        "Applicant may request arbitration by AAA or commence a lawsuit under §5106. The right to challenge expires 2 years after denial (or last partial payment).",
      items: [
        { id: "rightsAcknowledged", type: "radio", label: "Notice of rights provided?", options: YES_NO },
        { id: "denyMailingDate", type: "date", label: "Date NF-10 mailed", required: true },
      ],
    },
    {
      id: "signature",
      title: "6. Insurer signature",
      items: [
        { id: "insurerSignatory", type: "text", label: "Signatory name & title (typed)" },
        { id: "insurerSignDate", type: "date", label: "Date signed" },
      ],
    },
  ],
};
