# Gap analysis: case-builder vs. Jubilee Pro

case-builder has schedule schemas, means test, document/bank extraction, and human review — but it's a single-firm prototype, not a full practice platform.

## Filing & forms
- **E-filing to CM/ECF courts** — Jubilee files directly to every CM/ECF court. case-builder has no PDF output at all (`docs/INTEGRATIONS.md` gap #12), let alone e-filing.
- **PDF generation of official forms** — flagged as a known gap.
- **Chapter 11 / 12 support** — Jubilee covers 7/11/12/13. case-builder has schedules but `FORM_ORDER` treats Ch 7 and Ch 13 identically and Ch 11/12 aren't modeled.
- **Chapter 13 plan (Form 113)** — explicitly noted missing.
- **Court notice ingestion** — Jubilee auto-downloads and indexes court emails. Not present.

## Practice management
- **Multi-user / multi-tenant + auth** — everything keys off a `caseId` in localStorage. Jubilee has user accounts, roles, tiered seat plans.
- **Audit trail** — provenance of extracted data is lost on apply. Required for legal review.
- **Persistent storage** — uploaded docs and Teller tokens are in-memory `Map`s on `globalThis`.
- **Customizable jurisdiction/court defaults** — not present.
- **Creditor database with pre-populated addresses** — not present.
- **USPS address verification** — not present.

## Client-facing
- **Client portal** with secure document upload by clients (case-builder has firm-side upload only).
- **Secure messaging** between client and firm.
- **SMS to clients** stored per case.
- **E-signatures** (SignNow in Jubilee).
- **Credit counseling / debtor education ordering** built in.

## Money
- **Payment processing** (LawPay in Jubilee) with cards / eCheck / scheduled payments.
- **IOLTA trust accounting** + payment plan tracking.

## Third-party ecosystem
- Jubilee has **15+ integrations** (Clio, PracticePanther, Propel Paralegal, CaseDriver, CIN Legal, National Data Center, BK Packet). case-builder has two: Anthropic (extraction) and Teller (bank). No credit-bureau pull (Jubilee Credit Services equivalent).

## What case-builder has that Jubilee doesn't lead with
- LLM-based PDF extraction with a human-in-the-loop review queue
- Live bank-account pull via Teller (Jubilee partners for credit reports, not bank-aggregator pulls)

## Suggested priority order
1. PDF output of official forms — unblocks e-filing, signatures, and client deliverables.
2. Persistent storage + auth/multi-tenant — required before any of the rest.
3. Creditor database with pre-populated addresses.
4. Chapter 13 plan (Form 113).
5. Client portal (upload + messaging).
6. Payment processing + trust accounting.
7. E-filing to CM/ECF.
8. Court notice ingestion.
9. Credit-bureau integration.
