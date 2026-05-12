import { YES_NO } from "./common";
import type { FormSchema } from "./types";

export const piExperts: FormSchema = {
  id: "pi-experts",
  title: "Expert Witnesses",
  longTitle: "Personal Injury — Expert Witnesses & Reports",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "expertDisclosure",
      title: "Expert disclosure — CPLR §3101(d)",
      description:
        "NY CPLR §3101(d)(1)(i): upon demand, each party must identify each expert witness expected to testify at trial, state the subject matter on which the expert will testify, and provide the substance of the facts and opinions. Expert disclosure is typically exchanged after the Note of Issue is filed.",
      items: [
        {
          id: "expertDisclosureServed",
          type: "radio",
          label: "Plaintiff's CPLR §3101(d) expert disclosure served?",
          options: YES_NO,
        },
        {
          id: "expertDisclosureDate",
          type: "date",
          label: "Expert disclosure service date",
          visibleIf: { fieldId: "expertDisclosureServed", equals: "yes" },
        },
        {
          id: "defenseExpertDisclosureReceived",
          type: "radio",
          label: "Defense §3101(d) expert disclosure received?",
          options: YES_NO,
        },
        {
          id: "defenseExpertDisclosureDate",
          type: "date",
          label: "Defense expert disclosure date",
          visibleIf: { fieldId: "defenseExpertDisclosureReceived", equals: "yes" },
        },
        {
          id: "defenseExpertsSummary",
          type: "textarea",
          label: "Defense experts named (summary)",
          visibleIf: { fieldId: "defenseExpertDisclosureReceived", equals: "yes" },
        },
      ],
    },
    {
      id: "liabilityExperts",
      title: "Liability / causation experts",
      items: [
        {
          kind: "repeating-group",
          id: "liabilityExperts",
          label: "Liability experts",
          itemLabel: "Expert",
          fields: [
            { id: "expertName", type: "text", label: "Expert name", required: true },
            {
              id: "expertType",
              type: "select",
              label: "Specialty",
              options: [
                { value: "accident-reconstruction", label: "Accident reconstruction" },
                { value: "engineering", label: "Engineering / defect" },
                { value: "safety", label: "Safety / premises" },
                { value: "biomechanics", label: "Biomechanics" },
                { value: "toxicology", label: "Toxicology" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "expertFirm", type: "text", label: "Firm / affiliation" },
            { id: "expertPhone", type: "text", label: "Phone" },
            { id: "expertEmail", type: "text", label: "Email" },
            { id: "retainedDate", type: "date", label: "Date retained" },
            { id: "reportDueDate", type: "date", label: "Report due" },
            {
              id: "reportDelivered",
              type: "select",
              label: "Report status",
              options: [
                { value: "pending", label: "Pending" },
                { value: "draft", label: "Draft received" },
                { value: "final", label: "Final received" },
                { value: "served", label: "Served on defense" },
              ],
            },
            { id: "reportDate", type: "date", label: "Report date" },
          ],
        },
      ],
    },
    {
      id: "medicalExperts",
      title: "Medical experts",
      items: [
        {
          kind: "repeating-group",
          id: "medicalExperts",
          label: "Medical experts",
          itemLabel: "Expert",
          fields: [
            { id: "expertName", type: "text", label: "Expert name", required: true },
            {
              id: "expertSpecialty",
              type: "select",
              label: "Specialty",
              options: [
                { value: "orthopedics", label: "Orthopedics" },
                { value: "neurology", label: "Neurology / neurosurgery" },
                { value: "psychiatry", label: "Psychiatry / psychology" },
                { value: "physiatry", label: "Physiatry / rehab medicine" },
                { value: "radiology", label: "Radiology" },
                { value: "cardiology", label: "Cardiology" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "expertHospital", type: "text", label: "Hospital / practice" },
            { id: "expertPhone", type: "text", label: "Phone" },
            { id: "retainedDate", type: "date", label: "Date retained" },
            { id: "reportDueDate", type: "date", label: "Report due" },
            {
              id: "reportDelivered",
              type: "select",
              label: "Report status",
              options: [
                { value: "pending", label: "Pending" },
                { value: "draft", label: "Draft received" },
                { value: "final", label: "Final received" },
                { value: "served", label: "Served on defense" },
              ],
            },
            { id: "reportDate", type: "date", label: "Report date" },
          ],
        },
      ],
    },
    {
      id: "economicExperts",
      title: "Economic & life-care experts",
      items: [
        {
          kind: "repeating-group",
          id: "economicExperts",
          label: "Economic / vocational experts",
          itemLabel: "Expert",
          fields: [
            { id: "expertName", type: "text", label: "Expert name", required: true },
            {
              id: "expertType",
              type: "select",
              label: "Type",
              options: [
                { value: "economist", label: "Economist (lost earnings)" },
                { value: "vocational", label: "Vocational rehabilitation" },
                { value: "life-care-planner", label: "Life care planner" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "expertFirm", type: "text", label: "Firm" },
            { id: "expertPhone", type: "text", label: "Phone" },
            { id: "retainedDate", type: "date", label: "Date retained" },
            { id: "reportDueDate", type: "date", label: "Report due" },
            {
              id: "reportDelivered",
              type: "select",
              label: "Report status",
              options: [
                { value: "pending", label: "Pending" },
                { value: "draft", label: "Draft received" },
                { value: "final", label: "Final received" },
                { value: "served", label: "Served on defense" },
              ],
            },
          ],
        },
      ],
    },
  ],
};
