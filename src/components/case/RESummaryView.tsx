"use client";

import { useCaseStore } from "@/state/case-store";
import { reStats } from "@/lib/derived";
import { formatCurrency } from "@/lib/currency";

const TX_LABELS: Record<string, string> = {
  "purchase": "Purchase",
  "sale": "Sale",
  "refinance": "Refinance",
  "lease": "Lease",
  "exchange": "1031 Exchange",
};

const FINANCING_LABELS: Record<string, string> = {
  "cash": "Cash",
  "conventional": "Conventional",
  "fha": "FHA",
  "va": "VA",
  "usda": "USDA",
  "other": "Other",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  "single-family": "Single-family",
  "condo": "Condominium",
  "townhouse": "Townhouse",
  "multi-unit": "Multi-unit",
  "commercial": "Commercial",
  "land": "Vacant land",
  "other": "Other",
};

export function RESummaryView() {
  const record = useCaseStore((s) => {
    const id = s.activeCaseId;
    return id ? s.cases[id] : undefined;
  });
  if (!record) return null;

  const s = reStats(record.forms);
  const propertyType = record.forms["re-property"]?.propertyType as string | undefined;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <SummaryCard title="Property">
        <Row label="Address" value={s.propertyAddress || "—"} />
        <Row
          label="Type"
          value={propertyType ? (PROPERTY_TYPE_LABELS[propertyType] ?? propertyType) : "—"}
        />
        <Row label="Client" value={record.debtorName || "—"} />
      </SummaryCard>

      <SummaryCard title="Transaction">
        <Row
          label="Type"
          value={s.transactionType ? (TX_LABELS[s.transactionType] ?? s.transactionType) : "—"}
        />
        <Row
          label="Price"
          value={s.purchasePrice > 0 ? formatCurrency(s.purchasePrice) : "—"}
          accent={s.purchasePrice > 0}
        />
        <Row
          label="Expected closing"
          value={
            s.expectedClosingDate
              ? new Date(s.expectedClosingDate).toLocaleDateString(undefined, { dateStyle: "medium" })
              : "—"
          }
        />
      </SummaryCard>

      <SummaryCard title="Financing">
        <Row
          label="Type"
          value={s.financingType ? (FINANCING_LABELS[s.financingType] ?? s.financingType) : "—"}
        />
        <Row
          label="Loan amount"
          value={s.loanAmount > 0 ? formatCurrency(s.loanAmount) : "—"}
        />
        <Row
          label="Lender"
          value={(record.forms["re-financing"]?.lenderName as string | undefined) || "—"}
        />
      </SummaryCard>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper-2)] p-4 space-y-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--mute)]">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">{label}</p>
      <p
        className={
          "mt-0.5 text-[15px] tracking-[-0.01em] tabular-nums " +
          (accent ? "text-[var(--accent-deep)]" : "text-[var(--ink)]")
        }
        style={{ fontFamily: "var(--serif)" }}
      >
        {value}
      </p>
    </div>
  );
}
