# Tabula

An AI-first legal case management platform for New York law firms. Built for practices specializing in personal injury, real estate, and bankruptcy — with intelligent document extraction, a case-aware AI assistant, and a client self-service portal.

> **Target market:** NY boutique firms that need the depth of Clio with the AI-native experience of Legora OS, without the enterprise price tag.

---

## What's built

### Practice areas
- **Bankruptcy** — Chapter 7, Chapter 13, and standalone means test (§707(b)). Official court schedules 101, 106A/B–J, 107, 113, 122A-1/2, means test result.
- **Personal Injury (NY)** — Client intake, medical treatment, damages & losses, insurance, no-fault/NF-2, expert witnesses, retainer & fee calculation, claim/demand tracking. NY-specific: Notice of Claim (GML §50-e), §50-h hearing, serious injury threshold (§5102(d)), SOL tracking (CPLR), WC/Medicare/Medicaid lien tracking, NY litigation workflow (index number, RJI, Bill of Particulars, EBT, Note of Issue), infant compromise proceedings.
- **Real Estate (NY)** — Parties & agents, property details (co-op/condo/single-family), contract of sale, transaction terms, financing (including co-op UCC/share loans), due diligence (title search, judgment/lien search, NYC DOB/ECB/HPD violations, CO & zoning, UCC search), NY tax forms (TP-584, RP-5217, NYC RPT, mansion tax, MRT/CEMA, IT-2663/2664, FIRPTA), title & closing with ACRIS recording.

### Schema-driven forms
Every field in every form is defined in a TypeScript schema (`src/lib/schemas/`). The `FormRenderer` component is fully generic — no code changes needed to add a new form, just a schema file. Conditional field visibility (`visibleIf`) is handled automatically.

### AI document extraction
Upload a PDF (pay stub, bank statement, deed, insurance declaration) → Claude extracts structured data → patches are queued in a review screen → attorney accepts/rejects field by field before anything lands in the case.

### Bank data import
Teller Connect links a bank account → transactions are pulled → Claude maps them to form fields → same review/approval queue as document extraction.

### Tabula AI assistant
Case-aware AI chatbot powered by Claude Sonnet. Has full context of all filled form data for the current case. Available as a floating popup on every case page and as a full-screen "Virtual Assistant" tab in the case workspace. Answers questions about deadlines, legal concepts, next steps, and case-specific details.

### Client portal
Shareable link sent to client by email. Client logs in, completes a practice-area-appropriate intake form, and uploads documents — all without needing attorney access. Portal intake adapts to practice area (PI client intake vs. RE parties form vs. bankruptcy debtor info).

### Authentication & data
- **Clerk** for authentication (attorneys and clients share the same auth system, access-controlled at the Convex query/mutation level)
- **Convex** as the real-time backend database with live sync
- **Zustand** for client-side state with a 2-second debounced sync back to Convex

---

## Roadmap

### Near-term (v1 → v1.5)
- **Docketing & deadline engine** — Auto-calculate key deadlines from case data (NOC 90-day from incident date, SOL from CPLR category, TP-584 15-day from deed delivery, NF-2 30-day, etc.) and surface them as alerts on the case dashboard and a firm-wide calendar view.
- **AI document drafting** — Generate demand letters, Notices of Claim, retainer agreements, and closing checklists directly from filled case data using Claude. One-click draft → attorney reviews → exports to PDF or Word.
- **Internal notes & activity feed** — Per-case comment thread and audit log (who changed what, when). Paralegal and associate can leave notes for the supervising attorney.

### Medium-term (v2)
- **Multi-user / team roles** — Partner, associate, paralegal, and client roles with per-role permissions. Case assignment and workload view.
- **Task management** — Checklists tied to case milestones (e.g., "File NOC," "Serve Bill of Particulars," "Order title search") with due dates and assignees.
- **Email integration** — Send and receive case-related emails from within Tabula. Inbound emails auto-thread to the relevant case. AI drafts replies with case context.
- **Conflict checking** — Before opening a new matter, search all parties across existing cases for potential conflicts of interest.
- **Billing & time tracking** — Log time entries against a matter, track contingency fee milestones, generate invoices. NY sliding-scale fee calculator already in the PI retainer form.

### Long-term (v3+)
- **NYSCEF / eCourts e-filing** — File directly with NY courts from within Tabula. Pre-fill court forms from case data.
- **IOLTA trust accounting** — Track client funds in trust, generate ledgers, comply with NY Rules of Professional Conduct 1.15.
- **Reporting & analytics** — Firm-wide dashboards: open matters by type, revenue pipeline, deadlines this week, average time-to-close by case type.
- **Mobile app** — React Native client for attorneys to review and update cases on the go.
- **Settlement calculator** — Model net recovery scenarios (gross settlement → sliding-scale fee → lien payoffs → costs → net client) with what-if inputs.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Backend / DB | Convex (real-time, serverless) |
| Auth | Clerk |
| AI | Anthropic Claude (document extraction + assistant) |
| State | Zustand |
| Styling | Tailwind CSS v4 |
| Bank data | Teller Connect |

## Development

```bash
# Prerequisites: Node 20+, copy .env.local.example → .env.local

npm run dev          # Next.js on :3000
npx convex dev       # Convex backend watcher (separate terminal)

npx tsc --noEmit     # Type-check
npx next build       # Production build
npm run lint         # ESLint
```

Required env vars: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

Optional (app runs in demo/mock mode without these): `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_TELLER_APPLICATION_ID`
