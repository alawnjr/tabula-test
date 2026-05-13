"use client";

import { useCaseStore } from "@/state/case-store";
import { eaStats } from "@/lib/derived";
import { formatCurrency } from "@/lib/currency";

const WILL_STATUS_LABEL: Record<string, string> = {
  yes: "Testate",
  no: "Intestate",
  unknown: "Unknown",
};

const LETTER_STATUS_LABEL: Record<string, string> = {
  "not-filed": "Letters not filed",
  filed: "Petition filed",
  issued: "Letters issued",
};

export function EASummaryView() {
  const record = useCaseStore((s) => {
    const id = s.activeCaseId;
    return id ? s.cases[id] : undefined;
  });
  if (!record) return null;

  const s = eaStats(record.forms);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <SummaryCard title="Estate profile">
        <Row label="Decedent" value={record.debtorName || "—"} />
        <Row
          label="Date of death"
          value={
            s.decedentDod
              ? new Date(s.decedentDod).toLocaleDateString(undefined, { dateStyle: "medium" })
              : "—"
          }
        />
        <Row
          label="Days since DOD"
          value={s.daysSinceDod != null ? String(s.daysSinceDod) : "—"}
        />
        <Row label="Domicile" value={s.domicileState || "—"} />
      </SummaryCard>

      <SummaryCard title="Gross estate">
        <Row label="Real property" value={formatCurrency(s.realProperty)} />
        <Row label="Financial" value={formatCurrency(s.financial)} />
        <Row label="Retirement" value={formatCurrency(s.retirement)} />
        <Row label="Life insurance" value={formatCurrency(s.lifeInsurance)} />
        <Row label="Other" value={formatCurrency(s.vehicles + s.personal + s.business)} />
        <Row label="Gross total" value={formatCurrency(s.grossEstate)} accent />
      </SummaryCard>

      <SummaryCard title="Status">
        <Row
          label="Will"
          value={s.willStatus ? (WILL_STATUS_LABEL[s.willStatus] ?? s.willStatus) : "—"}
        />
        <Row
          label="Letters"
          value={s.letterStatus ? (LETTER_STATUS_LABEL[s.letterStatus] ?? s.letterStatus) : "—"}
        />
        <Row label="Beneficiaries" value={s.beneficiaryCount > 0 ? String(s.beneficiaryCount) : "—"} />
        <Row label="Liabilities" value={formatCurrency(s.totalLiabilities)} />
        <Row label="Net estate" value={formatCurrency(s.netEstate)} accent={s.netEstate >= 0} />
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
