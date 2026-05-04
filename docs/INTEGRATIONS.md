# Integrations lane — state & gaps

This is the "data in" side of `case-builder`: pulling financial data from
**uploaded documents** and **bank connections**, normalizing it, and letting a
human approve before it lands on the bankruptcy schedules.

The questionnaire/form-builder side (schemas, FormRenderer, case store) is a
separate lane and is documented by reading the code under `src/lib/schemas/`
and `src/components/form-renderer/`.

---

## What's wired up

### Pipeline

```
[Upload PDF]   ─┐
                ├─►  /api/extract  ──►  Claude (PDF → JSON)  ──┐
[Plaid Link]   ─┘                                              ├─►  ExtractedDoc
                                                               │
                /api/plaid/pull  ──►  accounts + liabilities ──┘
                                                               │
                                                               ▼
                                          buildPatches(doc)  ──►  FormPatch[]
                                                               │
                                                               ▼
                                          /case/[id]/review  (human approval)
                                                               │
                                                               ▼
                                          case-store: setFieldValue / appendRepeatingItem
```

### Files

**Server routes** (`src/app/api/`)
- `upload/route.ts` — multipart upload, in-memory store, returns `docId`
- `extract/route.ts` — `{ docId } → { extracted, patches }` via Claude PDF
- `plaid/link-token/route.ts` — creates a Plaid Link token
- `plaid/exchange/route.ts` — `public_token → access_token` (server-side)
- `plaid/pull/route.ts` — pulls accounts + liabilities for a case

**Lib** (`src/lib/integrations/`)
- `types.ts` — `ExtractedDoc`, `FormPatch`, normalized item kinds
- `redact.ts` — strips SSN / cards / accounts / routing / email; preserves last 4
- `mapping.ts` — `buildPatches(doc)` → patches keyed to schema field IDs
- `extractor.ts` — Claude `messages.create` with PDF document block
- `plaidClient.ts`, `plaidPull.ts`, `plaidTokens.ts` — Plaid client + pull
- `store.ts` — in-memory uploaded-doc store
- `demoMode.ts` — `isDemoMode`, `isAnthropicConfigured`, `isPlaidConfigured`

**Client**
- `state/review-store.ts` — zustand bundle keyed by caseId
- `components/case/IntegrationsPanel.tsx` — Upload doc / Connect bank entry
- `app/case/[caseId]/review/page.tsx` — accept/reject patches, apply

### Schema field IDs the mapper writes to

The mapper hard-codes these IDs. If schemas under `src/lib/schemas/` rename a
field, mapping breaks silently — re-check this list whenever schemas change.

| Source kind | Form | Group / field IDs |
|---|---|---|
| `depositAccount` | 106AB | `depositAccounts[]`: `type`, `institution`, `lastFour`, `balance` |
| `securedDebt` | 106D | `securedCreditors[]`: `creditorName`, `accountLast4`, `dateIncurred`, `lienType`, `collateralDescription`, `claimAmount`, `collateralValue`, `unsecuredPortion` |
| `unsecuredDebt` | 106EF | `nonpriorityCreditors[]`: `creditorName`, `accountLast4`, `dateIncurred`, `claimType`, `basis`, `claimAmount` |
| `realEstate` | 106AB | `realEstate[]`: `description`, `locationLine1/City/State/Zip`, `currentValue`, `lienAmount` |
| `vehicle` | 106AB | `vehicles[]`: `vehicleType`, `make`, `model`, `year`, `mileage`, `currentValue` |
| `retirement` | 106AB | `retirement[]`: `type`, `institution`, `value` |
| `payStub` | 106I | scalars `d1/d2GrossWages`, `d1/d2OvertimePay`, `d1/d2PayrollTax`, `d1/d2MandatoryRetirement`, `d1/d2VoluntaryRetirement`, `d1/d2Insurance`, `d1/d2UnionDues`, `d1/d2OtherDeductions`; plus `debtor1/2Employer`, `debtor1/2Occupation` |

---

## Demo mode

Without keys, every external call returns plausible mock data. Set in
`.env.local`:

```
DEMO_MODE=true        # force mocks even when keys exist
DEMO_MODE=false       # require real keys
# (unset: auto — demo if keys missing, real if present)
```

---

## API keys / accounts a developer needs

| Key | Required for | Where to get | Env var |
|---|---|---|---|
| Anthropic API key | Claude PDF extraction | https://console.anthropic.com/settings/keys | `ANTHROPIC_API_KEY` |
| Plaid sandbox client_id + secret | Bank connections (free) | https://dashboard.plaid.com/signup | `PLAID_CLIENT_ID`, `PLAID_SECRET` |

Optional Plaid env vars (defaults shown):
- `PLAID_ENV=sandbox`
- `PLAID_PRODUCTS=auth,liabilities,assets,transactions`
- `PLAID_COUNTRY_CODES=US`

Copy `.env.local.example` → `.env.local` to start.

---

## Gaps (what's still TODO)

### Blocking for production

1. **Real Plaid Link UI.** The "Connect bank" button currently skips Plaid Link
   and goes straight to the mock branch via a fake `public_token`. To wire
   real Link: use `react-plaid-link` (already installed) to fetch a token
   from `/api/plaid/link-token`, render the Link button, then POST the
   `public_token` from `onSuccess` to `/api/plaid/exchange`.
   _~30 lines, in `src/components/case/IntegrationsPanel.tsx`._

2. **Persistent storage.** Both stores are `Map`s on `globalThis` and reset on
   every dev-server restart:
   - Uploaded doc bytes — `src/lib/integrations/store.ts`
   - Plaid access tokens — `src/lib/integrations/plaidTokens.ts`
   Replace with S3 / Vercel Blob (docs) and a real DB / encrypted KV (tokens).

3. **Auth + multi-tenant.** Everything keys off `caseId` from `localStorage`.
   No users, no isolation. Plaid access tokens are stored unencrypted by
   `caseId` — anyone with the caseId can pull the bank data. Production needs
   real auth, encrypted-at-rest tokens, and access-control checks on every
   route.

4. **Audit trail.** Right now an extracted patch is applied (or not) and the
   provenance is lost. Required for legal review: store
   `{caseId, sourceDoc, extractedJson, acceptedPatches, rejectedPatches,
   approvedBy, approvedAt}` per session.

5. **Schema-mapping drift check.** `mapping.ts` references schema field IDs
   as plain strings. If a schema field is renamed in `src/lib/schemas/*.ts`,
   mapping silently writes to a non-existent path. Either:
   - generate the mapper from the schemas, or
   - add a build-time test that asserts every mapper-referenced ID exists in
     the corresponding `FormSchema`.

### Nice-to-haves

6. **Streaming extraction.** Long PDFs run for 20–60s. Switch to SSE / streaming
   so the review UI can show items as they're parsed.

7. **Per-doc-type prompts.** A single prompt asks Claude to handle bank
   statements, pay stubs, mortgage statements, and tax returns. Targeted
   prompts (or pre-classifying the doc) will lift accuracy.

8. **Pre-extraction redaction.** Today the doc bytes are sent to Anthropic
   as-is and redaction runs on the parsed JSON. If sending raw SSNs/account
   numbers to Anthropic isn't acceptable, add a PDF-to-text pass with
   redaction first, then extract from redacted text.

9. **Confidence scores per patch.** Claude can be asked to emit confidences;
   surface them in the review UI so reviewers can prioritize low-confidence
   rows.

10. **Plaid `transactions` → SOFA Part 2.** Already pulled; not yet mapped to
    `form-107` income sources.

11. **PDF rendering of the official forms.** Out of this lane but worth
    flagging — JSON export round-trips, but there's no PDF output for any
    schedule.

### Known limitations (by design, for now)

- **Node 20+ required** to run `next dev`/`build` (Next 16 requirement). The
  repo is fine on Node 18 for type-checking but won't build.
- **No tests.** Manually verified end-to-end via the UI; no automated coverage.
- **Schemas treat Ch 7 and Ch 13 identically** (same `FORM_ORDER`); Ch 13
  needs a plan form (113) not yet implemented (separate lane).

---

## Quick reference for "what does the dev need to do?"

**To run the demo (no keys):**
```bash
nvm use 22
npm install
npm run dev
```

**To run with real keys:**
```bash
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY and PLAID_CLIENT_ID / PLAID_SECRET
nvm use 22
npm install
npm run dev
```

**To verify after changes:**
```bash
npx tsc --noEmit
npx next build
```
