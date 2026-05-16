import { YES_NO } from "./common";
import type { FormSchema } from "./types";

// Request for Judicial Intervention — UCS-840 (Rev. 7/2023).
// Filed under 22 NYCRR §202.6 to place a case on the court's calendar.

export const piRji: FormSchema = {
  id: "pi-rji",
  title: "RJI (UCS-840)",
  longTitle: "Request for Judicial Intervention — UCS-840",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "caption",
      title: "1. Court / caption",
      items: [
        { id: "courtName", type: "text", label: "Supreme Court / County Court", required: true, placeholder: "Supreme Court" },
        { id: "courtCounty", type: "text", label: "County", required: true },
        { id: "indexNumber", type: "text", label: "Index number", required: true },
        { id: "dateIndexPurchased", type: "date", label: "Date index number purchased" },
        { id: "captionPlaintiff", type: "text", label: "Plaintiff(s) — caption", required: true },
        { id: "captionDefendant", type: "text", label: "Defendant(s) — caption", required: true },
      ],
    },
    {
      id: "nature",
      title: "2. Nature of action — Tort",
      description:
        "Personal injury matters are filed as a Tort sub-classification. Choose the most specific category.",
      items: [
        {
          id: "tortCategory",
          type: "select",
          label: "Tort sub-classification",
          required: true,
          options: [
            { value: "motor-vehicle", label: "Motor vehicle" },
            { value: "asbestos", label: "Asbestos" },
            { value: "breast-implant", label: "Breast implant" },
            { value: "environmental", label: "Environmental" },
            { value: "medical-dental", label: "Medical, dental or podiatric malpractice" },
            { value: "products-liability", label: "Products liability" },
            { value: "other-negligence", label: "Other negligence" },
            { value: "other-professional-malpractice", label: "Other professional malpractice" },
            { value: "other-tort", label: "Other tort (specify)" },
          ],
        },
        { id: "tortCategoryOther", type: "text", label: "If Other — specify", visibleIf: { fieldId: "tortCategory", equals: "other-tort" } },
      ],
    },
    {
      id: "reliefRequested",
      title: "3. Reason for filing this RJI",
      items: [
        {
          id: "reliefType",
          type: "select",
          label: "Relief requested",
          required: true,
          options: [
            { value: "request-preliminary-conference", label: "Request for preliminary conference" },
            { value: "notice-of-motion", label: "Notice of motion (motion #_)" },
            { value: "notice-of-petition", label: "Notice of petition" },
            { value: "notice-of-medical-malpractice-action", label: "Notice of medical, dental or podiatric malpractice action" },
            { value: "statement-of-net-worth", label: "Statement of net worth" },
            { value: "writ-of-habeas-corpus", label: "Writ of habeas corpus" },
            { value: "order-to-show-cause", label: "Order to show cause" },
            { value: "other-ex-parte", label: "Other ex parte application (specify)" },
            { value: "note-of-issue-cert-readiness", label: "Note of issue / certificate of readiness" },
            { value: "infant-compromise", label: "Infant's compromise" },
            { value: "transfer-to-supreme", label: "Transfer to Supreme Court" },
          ],
        },
        { id: "reliefOtherDescription", type: "text", label: "If Other — describe" },
        { id: "motionReturnDate", type: "date", label: "Motion return date (if applicable)" },
      ],
    },
    {
      id: "related",
      title: "4. Related cases",
      items: [
        { id: "relatedCasesExist", type: "radio", label: "Are there any related actions?", options: YES_NO },
        {
          kind: "repeating-group",
          id: "relatedCases",
          label: "Related cases",
          itemLabel: "Related case",
          fields: [
            { id: "title", type: "text", label: "Case title" },
            { id: "indexNumber", type: "text", label: "Index number" },
            { id: "court", type: "text", label: "Court" },
            { id: "judge", type: "text", label: "Judge (if assigned)" },
            { id: "relationship", type: "select", label: "Relationship", options: [
              { value: "pending", label: "Pending — related" },
              { value: "consolidated", label: "Consolidated" },
              { value: "joint-trial", label: "Joint trial ordered" },
              { value: "disposed", label: "Disposed" },
            ] },
          ],
        },
      ],
    },
    {
      id: "parties",
      title: "5. Parties & attorneys",
      items: [
        {
          kind: "repeating-group",
          id: "partyAttorneys",
          label: "Each party & its attorney",
          itemLabel: "Party",
          fields: [
            { id: "role", type: "select", label: "Role", options: [
              { value: "plaintiff", label: "Plaintiff" },
              { value: "defendant", label: "Defendant" },
              { value: "third-party", label: "Third-party defendant" },
              { value: "intervenor", label: "Intervenor" },
            ] },
            { id: "partyName", type: "text", label: "Party name" },
            { id: "attorneyName", type: "text", label: "Attorney name / firm" },
            { id: "attorneyAddress", type: "text", label: "Attorney address" },
            { id: "attorneyPhone", type: "text", label: "Phone" },
            { id: "attorneyEmail", type: "text", label: "Email" },
            { id: "insuranceCarrier", type: "text", label: "Insurance carrier (if known)" },
          ],
        },
      ],
    },
    {
      id: "filerCert",
      title: "6. Affirmation / signature",
      items: [
        { id: "filingAttorney", type: "text", label: "Attorney signing (typed)", required: true },
        { id: "attorneyFirm", type: "text", label: "Firm name" },
        { id: "attorneyRegNo", type: "text", label: "Attorney registration number" },
        { id: "filingDate", type: "date", label: "Filing date" },
      ],
    },
  ],
};
