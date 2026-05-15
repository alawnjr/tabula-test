import { US_STATES } from "./common";
import type { FormSchema } from "./types";

// Notice of Claim — General Municipal Law §50-e.
// Must be served on the public corporation within 90 days of accrual,
// before suit may be commenced. Mandatory elements are defined in
// §50-e(2): claimant, attorney, nature of claim, time/place, manner,
// and items of damage.

export const piNoticeOfClaim: FormSchema = {
  id: "pi-notice-of-claim",
  title: "Notice of Claim (§50-e)",
  longTitle: "Notice of Claim — General Municipal Law §50-e",
  appliesTo: ["personalInjury"],
  sections: [
    {
      id: "caption",
      title: "1. Public corporation served",
      description:
        "Identify the public corporation against which the claim is made. Service must be by personal delivery or certified mail within 90 days of accrual.",
      items: [
        { id: "publicCorporation", type: "text", label: "Name of public corporation", required: true, placeholder: "City of New York / NYC Health + Hospitals / Long Island Rail Road / etc." },
        { id: "serviceOnOffice", type: "text", label: "Office served (e.g., Comptroller, Corporation Counsel)" },
        { id: "serviceAddress", type: "text", label: "Service address" },
        { id: "serviceCity", type: "text", label: "City" },
        { id: "serviceState", type: "select", label: "State", options: US_STATES },
        { id: "serviceZip", type: "text", label: "ZIP code" },
      ],
    },
    {
      id: "claimant",
      title: "2. Claimant — §50-e(2)(i)",
      description:
        "Name and post-office address of each claimant and of his/her/their attorneys, if any.",
      items: [
        { id: "claimantName", type: "text", label: "Claimant name", required: true },
        { id: "claimantStreet", type: "text", label: "Address" },
        { id: "claimantCity", type: "text", label: "City" },
        { id: "claimantState", type: "select", label: "State", options: US_STATES },
        { id: "claimantZip", type: "text", label: "ZIP code" },
        { id: "claimantDob", type: "date", label: "Date of birth" },
        { id: "claimantInfant", type: "checkbox", label: "Claimant is an infant (under 18)" },
        { id: "claimantGuardian", type: "text", label: "Parent / natural guardian (if infant)" },
        { id: "attorneyName", type: "text", label: "Attorney name & firm" },
        { id: "attorneyAddress", type: "text", label: "Attorney address" },
        { id: "attorneyPhone", type: "text", label: "Attorney telephone" },
      ],
    },
    {
      id: "nature",
      title: "3. Nature of the claim — §50-e(2)(ii)",
      items: [
        {
          id: "claimType",
          type: "select",
          label: "Nature of the claim",
          required: true,
          options: [
            { value: "personal-injury", label: "Personal injury" },
            { value: "wrongful-death", label: "Wrongful death" },
            { value: "property-damage", label: "Property damage" },
            { value: "civil-rights", label: "Civil rights (state law)" },
            { value: "other", label: "Other" },
          ],
        },
        {
          id: "negligenceTheory",
          type: "textarea",
          label: "Theory of liability",
          required: true,
          help: "E.g., negligent maintenance of sidewalk, negligent operation of municipal vehicle, premises liability, false arrest, etc.",
        },
      ],
    },
    {
      id: "timePlace",
      title: "4. Time when, place where, and manner — §50-e(2)(iii)",
      items: [
        { id: "accrualDate", type: "date", label: "Date claim accrued", required: true },
        { id: "accrualTime", type: "text", label: "Approximate time" },
        { id: "deadline90Day", type: "date", label: "90-day filing deadline", help: "Compute 90 days from the date of accrual; for infants, the period is tolled until age 18 but not more than 10 years" },
        { id: "locationStreet", type: "text", label: "Location — street", required: true },
        { id: "locationCity", type: "text", label: "City / borough" },
        { id: "locationState", type: "select", label: "State", options: US_STATES },
        { id: "locationZip", type: "text", label: "ZIP code" },
        { id: "locationCrossStreet", type: "text", label: "Cross street / nearest landmark" },
        { id: "locationDescription", type: "textarea", label: "Specific location description (lane, intersection, premises)" },
        { id: "manner", type: "textarea", label: "Manner in which the claim arose", required: true, help: "State facts in detail sufficient to allow investigation" },
      ],
    },
    {
      id: "damages",
      title: "5. Items of damage — §50-e(2)(iv)",
      description:
        "List the injuries claimed and items of damages. CPLR §3017(c) bars the demand of a specific dollar amount in personal-injury actions, but items must be itemized to the extent practicable.",
      items: [
        { id: "injuriesClaimed", type: "textarea", label: "Injuries claimed", required: true },
        { id: "medicalExpenses", type: "currency", label: "Past medical expenses (if known)" },
        { id: "futureMedical", type: "currency", label: "Future medical expenses (estimate)" },
        { id: "lostWages", type: "currency", label: "Lost wages (past)" },
        { id: "futureLostWages", type: "currency", label: "Future lost earnings (estimate)" },
        { id: "painSuffering", type: "textarea", label: "Pain and suffering / other damages" },
        { id: "propertyDamageAmount", type: "currency", label: "Property damage (if applicable)" },
      ],
    },
    {
      id: "verification",
      title: "6. Verification & signature",
      description:
        "The notice must be sworn to before a notary or a person authorized to administer oaths.",
      items: [
        { id: "verifiedBy", type: "select", label: "Verified by", options: [
          { value: "claimant", label: "Claimant" },
          { value: "attorney", label: "Attorney (CPLR §3020 — claimant outside county)" },
          { value: "guardian", label: "Parent / guardian (claimant is infant)" },
        ] },
        { id: "signatoryName", type: "text", label: "Signatory name (typed)", required: true },
        { id: "signatoryDate", type: "date", label: "Date signed" },
        { id: "venueCounty", type: "text", label: "State of New York, County of (for verification)" },
        { id: "notaryName", type: "text", label: "Notary public name" },
        { id: "notaryCommissionExpires", type: "date", label: "Notary commission expires" },
      ],
    },
  ],
};
