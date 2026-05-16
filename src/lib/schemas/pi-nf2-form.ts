import { US_STATES, YES_NO } from "./common";
import type { FormSchema } from "./types";

// Official NYS form: Application for Motor Vehicle No-Fault Benefits (NF-2)
// Fields and section order mirror the official PDF maintained by the
// NYS Department of Financial Services (Insurance Department).

export const piNf2Form: FormSchema = {
  id: "pi-nf2-form",
  title: "NF-2",
  longTitle:
    "Application for Motor Vehicle No-Fault Benefits (NF-2) — NYS DFS",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "carrier",
      title: "1. Self-insurer or insurance company",
      items: [
        { id: "carrierName", type: "text", label: "Name", required: true },
        { id: "carrierStreet", type: "text", label: "Mailing address" },
        { id: "carrierCity", type: "text", label: "City" },
        { id: "carrierState", type: "select", label: "State", options: US_STATES },
        { id: "carrierZip", type: "text", label: "ZIP code" },
        { id: "claimRepName", type: "text", label: "Claim representative" },
        { id: "claimRepPhone", type: "text", label: "Telephone" },
        { id: "policyNumber", type: "text", label: "Policy number" },
        { id: "claimNumber", type: "text", label: "Claim / file number" },
        { id: "dateOfAccident", type: "date", label: "Date of accident", required: true },
      ],
    },
    {
      id: "applicant",
      title: "2. Applicant for benefits (eligible injured person)",
      description:
        "Name and address of the eligible injured person, or — if the EIP is deceased — the legal representative of the estate.",
      items: [
        { id: "applicantName", type: "text", label: "Name (first, MI, last)", required: true },
        { id: "applicantStreet", type: "text", label: "Mailing address" },
        { id: "applicantCity", type: "text", label: "City" },
        { id: "applicantState", type: "select", label: "State", options: US_STATES },
        { id: "applicantZip", type: "text", label: "ZIP code" },
        { id: "applicantPhone", type: "text", label: "Telephone" },
        { id: "applicantDob", type: "date", label: "Date of birth" },
        { id: "applicantSSN", type: "text", label: "Social Security number (last 4)" },
        { id: "applicantSex", type: "select", label: "Sex", options: [
          { value: "M", label: "Male" },
          { value: "F", label: "Female" },
          { value: "X", label: "X" },
        ] },
        { id: "applicantMaritalStatus", type: "select", label: "Marital status", options: [
          { value: "single", label: "Single" },
          { value: "married", label: "Married" },
          { value: "divorced", label: "Divorced" },
          { value: "widowed", label: "Widowed" },
        ] },
      ],
    },
    {
      id: "insured",
      title: "3. Insured policyholder (if different from applicant)",
      items: [
        { id: "insuredName", type: "text", label: "Name of person who owns policy" },
        { id: "insuredRelationship", type: "text", label: "Relationship to applicant" },
        { id: "insuredStreet", type: "text", label: "Mailing address" },
        { id: "insuredCity", type: "text", label: "City" },
        { id: "insuredState", type: "select", label: "State", options: US_STATES },
        { id: "insuredZip", type: "text", label: "ZIP code" },
      ],
    },
    {
      id: "accident",
      title: "4. Details of accident",
      items: [
        { id: "accidentDate", type: "date", label: "Date of accident", required: true },
        { id: "accidentTime", type: "text", label: "Time" },
        { id: "accidentPlace", type: "text", label: "Place where accident occurred (city, county, state)" },
        { id: "accidentDescription", type: "textarea", label: "Description of accident", required: true },
        {
          id: "applicantWasIn",
          type: "select",
          label: "At the time of the accident, the applicant was",
          options: [
            { value: "driver", label: "Driver of insured vehicle" },
            { value: "passenger", label: "Passenger in insured vehicle" },
            { value: "passenger-other", label: "Passenger in other vehicle" },
            { value: "pedestrian", label: "Pedestrian" },
            { value: "bicyclist", label: "Bicyclist" },
            { value: "motorcyclist", label: "Motorcyclist" },
            { value: "other", label: "Other (describe in narrative)" },
          ],
        },
        { id: "vehicleOwner", type: "text", label: "Name of owner of insured vehicle" },
        { id: "vehicleOperator", type: "text", label: "Name of operator of insured vehicle" },
        { id: "vehicleLicensePlate", type: "text", label: "License plate # of insured vehicle" },
        { id: "vehiclePlateState", type: "select", label: "Plate state", options: US_STATES },
        { id: "policeReportNo", type: "text", label: "Police report number" },
      ],
    },
    {
      id: "injuries",
      title: "5. Description of injuries",
      items: [
        { id: "injuryDescription", type: "textarea", label: "Describe injuries sustained", required: true },
        {
          id: "treatmentStarted",
          type: "radio",
          label: "Have you been treated for these injuries?",
          options: YES_NO,
        },
        { id: "firstTreatmentDate", type: "date", label: "Date first treated" },
        { id: "firstProviderName", type: "text", label: "First provider — name" },
        { id: "firstProviderAddress", type: "text", label: "First provider — address" },
        {
          id: "hospitalized",
          type: "radio",
          label: "Were you hospitalized?",
          options: YES_NO,
        },
        { id: "hospitalName", type: "text", label: "Hospital name", visibleIf: { fieldId: "hospitalized", equals: "yes" } },
        { id: "admissionDate", type: "date", label: "Admission date", visibleIf: { fieldId: "hospitalized", equals: "yes" } },
        { id: "dischargeDate", type: "date", label: "Discharge date", visibleIf: { fieldId: "hospitalized", equals: "yes" } },
      ],
    },
    {
      id: "wageLoss",
      title: "6. Lost earnings",
      description:
        "No-Fault basic economic loss covers 80% of lost earnings up to $2,000/month for up to 3 years (Ins. Law §5102).",
      items: [
        {
          id: "lostTimeFromWork",
          type: "radio",
          label: "Have you lost time from work due to the accident?",
          options: YES_NO,
        },
        { id: "employerName", type: "text", label: "Employer name" },
        { id: "employerAddress", type: "text", label: "Employer address" },
        { id: "occupation", type: "text", label: "Occupation / job title" },
        { id: "weeklyWage", type: "currency", label: "Gross weekly wage at time of accident" },
        { id: "lastDayWorked", type: "date", label: "Last day worked before accident" },
        { id: "firstDayLost", type: "date", label: "First day lost from work" },
        { id: "returnToWork", type: "date", label: "Date returned to work (if any)" },
        {
          id: "stillDisabled",
          type: "radio",
          label: "Are you still disabled from working?",
          options: YES_NO,
        },
        {
          id: "wageContinuationPaid",
          type: "radio",
          label: "Have you been paid wage continuation, sick pay, or salary while disabled?",
          options: YES_NO,
        },
      ],
    },
    {
      id: "otherInsurance",
      title: "7. Other insurance / collateral sources",
      items: [
        {
          id: "otherNoFaultCovered",
          type: "radio",
          label: "Are you covered for No-Fault benefits under any other automobile policy?",
          options: YES_NO,
        },
        { id: "otherNoFaultCarrier", type: "text", label: "Other carrier name", visibleIf: { fieldId: "otherNoFaultCovered", equals: "yes" } },
        { id: "otherNoFaultPolicy", type: "text", label: "Other policy number", visibleIf: { fieldId: "otherNoFaultCovered", equals: "yes" } },
        {
          id: "workersCompClaim",
          type: "radio",
          label: "Was this accident sustained in the course of employment?",
          options: YES_NO,
        },
        { id: "wcCarrier", type: "text", label: "Workers' comp carrier", visibleIf: { fieldId: "workersCompClaim", equals: "yes" } },
        { id: "wcCaseNumber", type: "text", label: "WCB case number", visibleIf: { fieldId: "workersCompClaim", equals: "yes" } },
        {
          id: "healthInsuranceCoverage",
          type: "radio",
          label: "Do you have health insurance?",
          options: YES_NO,
        },
        { id: "healthInsurer", type: "text", label: "Health insurance carrier" },
        { id: "healthMemberId", type: "text", label: "Health policy / member ID" },
      ],
    },
    {
      id: "certification",
      title: "8. Applicant's certification",
      description:
        "Any person who knowingly and with intent to defraud any insurance company submits a false claim commits a Class E felony (NYS Insurance Law §403).",
      items: [
        { id: "applicantSignature", type: "text", label: "Signature of applicant (typed)" },
        { id: "applicantSignDate", type: "date", label: "Date signed" },
        { id: "guardianRepresentative", type: "text", label: "Parent / guardian / representative (if applicable)" },
      ],
    },
  ],
};
