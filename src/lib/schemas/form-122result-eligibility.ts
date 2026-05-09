import type { FormSchema } from "./types";

// Derived "form" — no fields, just a place in the FORM_ORDER for the
// eligibility result page. Rendered by a custom component, not FormRenderer.
export const form122Result: FormSchema = {
  id: "122Result",
  title: "Means test result",
  longTitle: "Chapter 7 eligibility — based on your 122A-1 and 122A-2 entries.",
  appliesTo: ["meansTest", "chapter7"],
  derived: true,
  sections: [],
};
