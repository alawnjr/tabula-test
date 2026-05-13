"use client";

import { useCaseStore } from "@/state/case-store";
import { piStats } from "@/lib/derived";
import { formatCurrency } from "@/lib/currency";

const INCIDENT_LABELS: Record<string, string> = {
  "motor-vehicle": "Motor vehicle accident",
  "slip-fall": "Slip and fall",
  "dog-bite": "Dog bite / animal attack",
  "medical-malpractice": "Medical malpractice",
  "product-liability": "Product liability",
  "premises-liability": "Premises liability",
  "other": "Other",
};

const STATUS_LABELS: Record<string, string> = {
  "investigation": "Under investigation",
  "treatment": "Active treatment",
  "demand-pending": "Demand pending",
  "negotiation": "In negotiation",
  "litigation": "Litigation filed",
  "settled": "Settled",
  "closed": "Closed",
};

export function PISummaryView() {
  const record = useCaseStore((s) => {
    const id = s.activeCaseId;
    return id ? s.cases[id] : undefined;
  });
  if (!record) return null;

  const s = piStats(record.forms);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <SummaryCard title="Incident">
        <Row label="Type" value={s.incidentType ? (INCIDENT_LABELS[s.incidentType] ?? s.incidentType) : "—"} />
        <Row
          label="Date"
          value={
            s.incidentDate
              ? new Date(s.incidentDate).toLocaleDateString(undefined, { dateStyle: "medium" })
              : "—"
          }
        />
        <Row label="Client" value={record.debtorName || "—"} />
      </SummaryCard>

      <SummaryCard title="Damages">
        <Row
          label="Medical bills"
          value={formatCurrency(
            num(record.forms["pi-damages"]?.totalMedicalBills)
          )}
        />
        <Row
          label="Future medical"
          value={formatCurrency(
            num(record.forms["pi-damages"]?.estimatedFutureMedical)
          )}
        />
        <Row
          label="Lost wages"
          value={formatCurrency(
            num(record.forms["pi-damages"]?.totalLostWages) +
            num(record.forms["pi-damages"]?.futureLostWages)
          )}
        />
        <Row label="Total estimated" value={formatCurrency(s.totalDamages)} accent />
      </SummaryCard>

      <SummaryCard title="Claim status">
        <Row
          label="Status"
          value={s.settlementStatus ? (STATUS_LABELS[s.settlementStatus] ?? s.settlementStatus) : "—"}
        />
        {s.demandAmount > 0 && (
          <Row label="Demand" value={formatCurrency(s.demandAmount)} />
        )}
        {s.offerAmount > 0 && (
          <Row label="Best offer" value={formatCurrency(s.offerAmount)} accent />
        )}
      </SummaryCard>
    </div>
  );
}

function num(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
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
