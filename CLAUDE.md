# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

# Commands

```bash
# Dev (requires Node 20+)
npm run dev            # Next.js dev server on :3000
npx convex dev         # Convex backend watcher (separate terminal)

# Type-check and build
npx tsc --noEmit
npx next build

# Lint
npm run lint           # eslint
```

No test suite exists. Verify changes by running `npx tsc --noEmit` and `npx next build`.

# Environment setup

Copy `.env.local.example` → `.env.local`. Required vars:
- `NEXT_PUBLIC_CONVEX_URL` — from `npx convex dev` output
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` — from Clerk dashboard

Optional (defaults to demo/mock mode if absent):
- `ANTHROPIC_API_KEY` — Claude PDF extraction
- `NEXT_PUBLIC_TELLER_APPLICATION_ID` — bank connections

See [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) for all integration env vars and the gap list.

# Architecture

## What this is

A multi-practice-area legal case-builder covering three practice areas:
- **Bankruptcy** — Chapter 7, Chapter 13, and standalone means test. Official court forms (101, 106AB–J, 107, 113, 122A-1/2) with bank data and document extraction.
- **Personal Injury** — Client intake, incident details, medical treatment, damages, insurance, claim/demand tracking.
- **Real Estate** — Parties, property details, transaction terms, financing, title/closing.

The landing page (`/`) lets attorneys choose a practice area. Each area has its own dashboard (`/bankruptcy`, `/personal-injury`, `/real-estate`), but all cases share the same case workspace at `/case/[caseId]/…`.

## Two user roles, two route trees

- **Attorney** (`/case/[caseId]/…`) — creates cases, fills forms, reviews integrations, prints/downloads.
- **Client/Debtor** (`/portal/[caseId]/…`) — invited via email (set on the case), completes intake form and uploads documents. The intake form shown is practice-area-specific (`intakeConfig()` in `portal/[caseId]/intake/page.tsx`). Restricted to their own data via `convex/cases.ts` access-control guards.

## Data flow

```
Clerk (auth) → ConvexClientProvider (wraps app)
                     │
                     ▼
            ConvexStoreSync (component in layout)
            ├── on mount: loads Convex cases → Zustand (case-store)
            └── on mutation: debounced 2s push back to Convex
```

All form edits go through `useCaseStore` (Zustand, `src/state/case-store.ts`). `ConvexStoreSync` (`src/components/ConvexStoreSync.tsx`) is the only place that reads from / writes to Convex. The Convex `cases` table stores `data: v.any()` which contains `{ forms, bankData, autofilled }`.

## Schema / form system

`src/lib/schemas/types.ts` defines the schema primitives: `Field`, `RepeatingGroup`, `Section`, `FormSchema`. Every official form has a schema file under `src/lib/schemas/`. `SCHEMAS` and `FORM_ORDER` in `src/lib/schemas/index.ts` are the registries.

`FormRenderer` / `SectionRenderer` / `FieldRenderer` (`src/components/form-renderer/`) consume a `FormSchema` and call `useCaseStore.setFieldValue(formId, path[], value)` on every change. Field paths are arrays of string/numeric keys; they're joined with `/` as autofill mark keys.

**Critical**: `src/lib/integrations/mapping.ts` hard-codes schema field IDs as plain strings. If you rename a field in a schema file, mapping silently breaks — update `mapping.ts` in the same commit.

`ChapterId` (`src/lib/schemas/types.ts`) is `"chapter7" | "chapter13" | "meansTest" | "personalInjury" | "realEstate"`. The `practiceAreaOf(chapter)` helper in `src/lib/schemas/index.ts` maps chapters to `"bankruptcy" | "personalInjury" | "realEstate"` — use it to guard bankruptcy-specific logic. The `PracticeAreaDashboard` component (`src/components/case/PracticeAreaDashboard.tsx`) is the shared dashboard used by all three area pages.

## Integrations lane

See [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) for the full pipeline, env vars, and gap list. Short version:

```
Upload PDF → /api/extract → Claude → ExtractedDoc → buildPatches() → review page → case-store
Teller Connect → /api/teller/enroll + /pull → ExtractedDoc → buildPatches() → review page
```

`useReviewStore` (`src/state/review-store.ts`) holds pending patches per case (persisted to `localStorage`). The review page at `/case/[caseId]/review` lets the attorney accept/reject each patch before it lands in the case store.

## Derived data

`src/lib/derived.ts` computes financial totals (assets, liabilities, income, expenses) from raw form data. These are display-only — nothing in the store is pre-aggregated.

## Means test

`src/lib/meansTest.ts` + `src/lib/schemas/form-122a1-cmi.ts` / `form-122a2-means.ts`. A `meansTest` case only shows those three forms. `branchToChapter()` in the case store copies a means-test case into a fresh Ch7/13 case.
