import { YES_NO } from "./common";
import type { FormSchema } from "./types";

// Note of Issue & Certificate of Readiness — 22 NYCRR §202.21.
// Filed to place a case on the trial calendar after discovery is complete.

export const piNoteOfIssue: FormSchema = {
  id: "pi-note-of-issue",
  title: "Note of Issue",
  longTitle: "Note of Issue & Certificate of Readiness — 22 NYCRR §202.21",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "caption",
      title: "1. Caption",
      items: [
        { id: "courtName", type: "text", label: "Court", required: true, placeholder: "Supreme Court" },
        { id: "courtCounty", type: "text", label: "County", required: true },
        { id: "indexNumber", type: "text", label: "Index number", required: true },
        { id: "captionPlaintiff", type: "text", label: "Plaintiff(s)" },
        { id: "captionDefendant", type: "text", label: "Defendant(s)" },
        { id: "filedBy", type: "select", label: "Filed by", options: [
          { value: "plaintiff", label: "Plaintiff" },
          { value: "defendant", label: "Defendant" },
          { value: "third-party-plaintiff", label: "Third-party plaintiff" },
        ] },
      ],
    },
    {
      id: "natureSection",
      title: "2. Nature of action & relief",
      items: [
        { id: "natureOfAction", type: "text", label: "Nature of action", required: true, placeholder: "Personal injury (motor vehicle)" },
        { id: "reliefSought", type: "textarea", label: "Relief sought" },
        { id: "jurisdictionalAmount", type: "currency", label: "Amount of damages claimed (if applicable)" },
        { id: "jurySize", type: "select", label: "Jury demand", options: [
          { value: "six", label: "Jury of 6" },
          { value: "twelve", label: "Jury of 12" },
          { value: "none", label: "Non-jury" },
        ] },
      ],
    },
    {
      id: "pleadings",
      title: "3. Pleadings & service dates",
      items: [
        { id: "summonsServedDate", type: "date", label: "Summons / complaint served" },
        { id: "answerServedDate", type: "date", label: "Answer served" },
        { id: "billOfParticularsServedDate", type: "date", label: "Bill of particulars served" },
        { id: "thirdPartyServedDate", type: "date", label: "Third-party complaint served (if any)" },
      ],
    },
    {
      id: "certReadiness",
      title: "4. Certificate of Readiness for Trial",
      description:
        "Each item below must be marked Completed, Waived, or Not required. The case is certified ready only when discovery is closed and there are no outstanding requests.",
      items: [
        { id: "disclosurePI", type: "select", label: "Discovery proceedings (CPLR 3101)", options: [
          { value: "completed", label: "Completed" },
          { value: "waived", label: "Waived" },
          { value: "not-required", label: "Not required" },
        ] },
        { id: "physicalExam", type: "select", label: "Physical examinations completed", options: [
          { value: "completed", label: "Completed" },
          { value: "waived", label: "Waived" },
          { value: "not-required", label: "Not required" },
        ] },
        { id: "exchangeMedical", type: "select", label: "Medical reports exchanged", options: [
          { value: "completed", label: "Completed" },
          { value: "waived", label: "Waived" },
          { value: "not-required", label: "Not required" },
        ] },
        { id: "ebtsCompleted", type: "select", label: "Examinations before trial (depositions)", options: [
          { value: "completed", label: "Completed" },
          { value: "waived", label: "Waived" },
          { value: "not-required", label: "Not required" },
        ] },
        { id: "billOfParticulars", type: "select", label: "Bill of particulars served and complete", options: [
          { value: "completed", label: "Completed" },
          { value: "waived", label: "Waived" },
          { value: "not-required", label: "Not required" },
        ] },
        { id: "discoveryAndInspection", type: "select", label: "Discovery and inspection", options: [
          { value: "completed", label: "Completed" },
          { value: "waived", label: "Waived" },
          { value: "not-required", label: "Not required" },
        ] },
        { id: "compliancePCOrder", type: "checkbox", label: "There has been compliance with each order of the court" },
        { id: "outstandingDiscovery", type: "checkbox", label: "There are no outstanding requests for discovery" },
        { id: "issueJoined", type: "checkbox", label: "There has been a reasonable opportunity to complete discovery" },
        { id: "thereAreNoOutstandingMotions", type: "checkbox", label: "There are no outstanding motions" },
      ],
    },
    {
      id: "feesAndJury",
      title: "5. Fees & jury demand",
      items: [
        { id: "feePaid", type: "radio", label: "Note of Issue fee paid?", options: YES_NO, help: "$30 jury, $95 non-jury (Supreme/County Court, CPLR §8020(a))" },
        { id: "juryDemandFiled", type: "radio", label: "Jury demand previously filed?", options: YES_NO },
      ],
    },
    {
      id: "signature",
      title: "6. Affirmation & signature",
      items: [
        { id: "attorneyName", type: "text", label: "Attorney signing (typed)", required: true },
        { id: "attorneyRegNo", type: "text", label: "Attorney registration number" },
        { id: "firmName", type: "text", label: "Firm name" },
        { id: "firmAddress", type: "text", label: "Firm address" },
        { id: "firmPhone", type: "text", label: "Telephone" },
        { id: "signatureDate", type: "date", label: "Date" },
      ],
    },
  ],
};
