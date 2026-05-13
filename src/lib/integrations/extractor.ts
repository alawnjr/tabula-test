// Document → ExtractedDoc. Uses Claude when configured; otherwise mocks.

import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedDoc } from "./types";
import { redactDeep } from "./redact";
import { isAnthropicConfigured } from "./demoMode";

export type ExtractionPracticeArea = "bankruptcy" | "estateAdmin";

const BANKRUPTCY_PROMPT = `You are a paralegal extracting facts from a financial document for a US bankruptcy filing.

Return STRICT JSON ONLY, no prose, no markdown fences. Output shape:

{
  "rawSummary": "1-3 sentence summary of the document",
  "items": [
    // Use ONLY these "kind" values. Omit fields you cannot extract.
    { "kind": "depositAccount", "institution": "...", "accountType": "checking|savings|moneyMarket|cd|brokerage|other", "lastFour": "1234", "balance": 0 },
    { "kind": "securedDebt",   "lienType": "mortgage|vehicle|judgment|statutory|security|other", "creditorName": "...", "lastFour": "1234", "claimAmount": 0, "collateralValue": 0, "collateralDescription": "...", "dateIncurred": "YYYY-MM-DD" },
    { "kind": "unsecuredDebt", "claimType": "studentLoans|domesticObligations|pensions|other", "creditorName": "...", "lastFour": "1234", "claimAmount": 0, "basis": "...", "dateIncurred": "YYYY-MM-DD" },
    { "kind": "realEstate",    "description": "...", "addressLine1": "...", "addressCity": "...", "addressState": "XX", "addressZip": "00000", "currentValue": 0, "lienAmount": 0 },
    { "kind": "vehicle",       "vehicleType": "car|truck|motorcycle|rv|boat|aircraft|other", "make": "...", "model": "...", "year": 2020, "mileage": 0, "currentValue": 0 },
    { "kind": "retirement",    "accountType": "...", "institution": "...", "value": 0 },
    { "kind": "payStub",       "debtor": 1, "employer": "...", "occupation": "...", "grossWages": 0, "overtimePay": 0, "payrollTax": 0, "mandatoryRetirement": 0, "voluntaryRetirement": 0, "insurance": 0, "unionDues": 0, "otherDeductions": 0 }
  ]
}

Rules:
- "lastFour" must be the LAST FOUR digits of the account number, never the full number.
- "balance" / "claimAmount" / "currentValue" / "grossWages" are numbers (no currency symbols, no commas).
- Pay-stub amounts must be MONTHLY. If you see weekly or biweekly figures, convert: weekly × 4.333, biweekly × 2.167, semi-monthly × 2.
- If the document type is unclear or you cannot extract anything reliable, return { "rawSummary": "...", "items": [] }.
`;

const ESTATE_ADMIN_PROMPT = `You are a paralegal extracting facts from a document for a US estate administration matter (probate / trust administration).

Return STRICT JSON ONLY, no prose, no markdown fences. Output shape:

{
  "rawSummary": "1-3 sentence summary of the document",
  "items": [
    // Use ONLY these "kind" values. Omit fields you cannot extract.
    { "kind": "eaDecedent", "nameFirst": "...", "nameMiddle": "...", "nameLast": "...", "dob": "YYYY-MM-DD", "dod": "YYYY-MM-DD", "ssnLast4": "1234", "domicileState": "XX", "addressStreet": "...", "addressCity": "...", "addressState": "XX", "addressZip": "00000" },
    { "kind": "eaBeneficiary", "name": "...", "relationship": "spouse|child|grandchild|parent|sibling|other-relative|non-relative|charity|trust", "sharePercent": 0, "contingent": false },
    { "kind": "eaBequest", "beneficiaryName": "...", "description": "...", "estimatedValue": 0 },
    { "kind": "eaRealProperty", "description": "...", "addressStreet": "...", "addressCity": "...", "addressState": "XX", "addressZip": "00000", "parcelId": "...", "titleType": "individual|joint-tenancy|tenancy-in-common|tenancy-by-entirety|community-property|trust|tod-pod", "dateOfDeathValue": 0, "mortgageBalance": 0 },
    { "kind": "eaFinancialAccount", "institution": "...", "accountType": "checking|savings|money-market|cd|brokerage|529|other", "lastFour": "1234", "titleType": "individual|joint-tenancy|tod-pod|trust", "todBeneficiary": "...", "dateOfDeathValue": 0 },
    { "kind": "eaRetirementAccount", "institution": "...", "accountType": "401k|403b|ira-traditional|ira-roth|pension|annuity|other", "lastFour": "1234", "designatedBeneficiary": "...", "designatedContingent": "...", "dateOfDeathValue": 0 },
    { "kind": "eaLifeInsurance", "insurer": "...", "policyNumber": "...", "owner": "...", "designatedBeneficiary": "...", "estateIsBeneficiary": false, "deathBenefit": 0 },
    { "kind": "eaVehicle", "year": 2020, "make": "...", "model": "...", "vin": "...", "titleType": "individual|joint-tenancy|tod-pod", "dateOfDeathValue": 0, "loanBalance": 0 },
    { "kind": "eaDebt", "creditor": "...", "debtKind": "mortgage|credit-card|auto-loan|medical|personal-loan|tax|utility|professional|other", "lastFour": "1234", "amount": 0, "incurredDate": "YYYY-MM-DD", "secured": false }
  ]
}

Document type guidance:
- Will / trust instrument → emit eaDecedent (if decedent identified), eaBeneficiary rows (one per residuary beneficiary), eaBequest rows (one per specific bequest).
- Death certificate → emit a single eaDecedent.
- Bank/brokerage statement → eaFinancialAccount per account; use the most-recent balance as dateOfDeathValue.
- Retirement statement (401k/IRA) → eaRetirementAccount; capture the named designated beneficiary if present.
- Life insurance declaration / policy → eaLifeInsurance with the death benefit.
- Deed / mortgage statement → eaRealProperty.
- Vehicle title / registration → eaVehicle.
- Final bill / credit-card statement → eaDebt.

Rules:
- "lastFour" must be the LAST FOUR digits of the account number, never the full number.
- All currency values are numbers (no currency symbols, no commas).
- Dates are ISO YYYY-MM-DD.
- Use empty/omitted fields rather than guessing.
- If the document type is unclear or you cannot extract anything reliable, return { "rawSummary": "...", "items": [] }.
`;

function promptFor(practiceArea: ExtractionPracticeArea): string {
  return practiceArea === "estateAdmin" ? ESTATE_ADMIN_PROMPT : BANKRUPTCY_PROMPT;
}

export async function extractFromPdf(
  bytes: Uint8Array,
  filename: string,
  practiceArea: ExtractionPracticeArea = "bankruptcy"
): Promise<ExtractedDoc> {
  const sourceLabel = filename;

  if (!isAnthropicConfigured()) {
    return mockExtraction(sourceLabel, practiceArea);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const base64 = Buffer.from(bytes).toString("base64");

  const resp = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: promptFor(practiceArea),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          },
          { type: "text", text: "Extract per the instructions. JSON only." },
        ],
      },
    ],
  });

  const text = resp.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("\n")
    .trim();

  const cleaned = stripCodeFences(text);
  let parsed: { rawSummary?: string; items?: unknown[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      source: "upload",
      sourceLabel,
      extractedAt: new Date().toISOString(),
      items: [],
      rawSummary: `(Failed to parse model output) ${cleaned.slice(0, 200)}`,
    };
  }

  const items = Array.isArray(parsed.items) ? parsed.items : [];
  const safe = redactDeep({
    rawSummary: parsed.rawSummary,
    items,
  });

  return {
    source: "upload",
    sourceLabel,
    extractedAt: new Date().toISOString(),
    rawSummary: safe.rawSummary,
    items: safe.items as ExtractedDoc["items"],
  };
}

function stripCodeFences(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function mockExtraction(
  sourceLabel: string,
  practiceArea: ExtractionPracticeArea
): ExtractedDoc {
  // Plausible mock so the demo flows end-to-end without keys.
  if (practiceArea === "estateAdmin") {
    return {
      source: "upload",
      sourceLabel,
      extractedAt: new Date().toISOString(),
      rawSummary:
        "[DEMO MOCK] Sample beneficiary-designation statement from a retirement custodian.",
      items: [
        {
          kind: "eaRetirementAccount",
          institution: "Fidelity",
          accountType: "ira-traditional",
          lastFour: "5512",
          designatedBeneficiary: "Jane Doe (spouse) — 100%",
          dateOfDeathValue: 184_320.5,
        },
        {
          kind: "eaFinancialAccount",
          institution: "JPMorgan Chase",
          accountType: "checking",
          lastFour: "4821",
          titleType: "individual",
          dateOfDeathValue: 12_476.55,
        },
      ],
    };
  }
  return {
    source: "upload",
    sourceLabel,
    extractedAt: new Date().toISOString(),
    rawSummary:
      "[DEMO MOCK] Sample bank statement showing checking + savings accounts at Chase.",
    items: [
      {
        kind: "depositAccount",
        institution: "JPMorgan Chase",
        accountType: "checking",
        lastFour: "4821",
        balance: 1247.55,
      },
      {
        kind: "depositAccount",
        institution: "JPMorgan Chase",
        accountType: "savings",
        lastFour: "9134",
        balance: 8412.0,
      },
    ],
  };
}
