"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

// Drafts narrative text for estate-admin documents (petition rationale,
// accounting cover, 706 cover letter). The view layer hands in section + a
// caseContext string built from the filled forms.

const SECTION_PROMPTS: Record<string, string> = {
  "petition-residuary":
    "Draft 1-2 paragraphs of the petition's residuary clause restatement and disposition. Plain narrative, third-person, referencing the will date. No legalese boilerplate beyond what is necessary.",
  "accounting-cover":
    "Draft a 1-paragraph cover narrative for the accounting filing. Summarize the period covered, the major receipts and disbursements categories, and any extraordinary items. Reference the date of letters issuance.",
  "706-cover":
    "Draft a 1-paragraph cover memo for the Form 706 filing. Note the gross-estate total, elections being made (QTIP, alternate valuation, portability) and any extension requested.",
  "distribution-letter":
    "Draft a brief distribution-cover letter to a beneficiary. Confirm the share they are receiving, attach a receipt and release waiver for signature, and note the next step.",
};

export const draftNarrative = action({
  args: {
    section: v.string(),
    caseContext: v.string(),
    audience: v.optional(v.string()),
  },
  handler: async (_ctx, { section, caseContext, audience }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const sectionPrompt =
      SECTION_PROMPTS[section] ??
      "Draft a short narrative section appropriate for an estate-administration filing.";

    if (!apiKey) {
      return {
        text: `[DEMO] Draft for section "${section}". Set ANTHROPIC_API_KEY to enable Claude drafting.\n\nContext snippet:\n${caseContext.slice(0, 400)}`,
      };
    }

    const system = `You are an estate-administration paralegal drafting a narrative section of a court filing or beneficiary correspondence. ${sectionPrompt}

Constraints:
- Use plain, professional prose.
- Refer only to facts present in the supplied case context. If a relevant fact is missing, leave a placeholder in [BRACKETS] rather than inventing it.
- Do NOT include any markdown formatting, headers, or bullet lists unless explicitly required.
- Output ONLY the drafted section text. No preamble. No commentary.${audience ? `\n- Audience: ${audience}.` : ""}`;

    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: `Case context:\n${caseContext}\n\nDraft the section now.`,
        },
      ],
    });

    const text = resp.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("\n")
      .trim();
    return { text };
  },
});
