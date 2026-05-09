"use client";

import { useCaseStore } from "@/state/case-store";
import { formatCurrency } from "@/lib/currency";
import { caseSummary } from "@/lib/derived";

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        "flex items-baseline justify-between py-1 text-[12.5px] " +
        (emphasis
          ? "border-t border-[var(--rule)] mt-1 pt-2 font-medium text-[var(--ink)]"
          : "text-[var(--ink-2)]")
      }
    >
      <span className={emphasis ? "" : "text-[var(--mute)]"}>{label}</span>
      <span className="tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}

function Panel({
  tag,
  title,
  description,
  children,
}: {
  tag: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)]">
      <header className="space-y-1 border-b border-[var(--rule-soft)] px-4 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          {tag}
        </span>
        <h3
          className="text-[15px] tracking-[-0.015em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          {title}
        </h3>
        <p className="text-[11px] text-[var(--mute)]">{description}</p>
      </header>
      <div className="px-4 py-2">{children}</div>
    </section>
  );
}

export function SummaryView() {
  const record = useCaseStore((s) =>
    s.activeCaseId ? s.cases[s.activeCaseId] : null
  );
  if (!record) return null;
  const s = caseSummary(record);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Panel
        tag="Sched. A/B"
        title="Assets"
        description="Current value of property you own."
      >
        <Row label="Real estate" value={s.assets.realEstate} />
        <Row label="Vehicles" value={s.assets.vehicles} />
        <Row label="Personal & household" value={s.assets.personal} />
        <Row label="Financial" value={s.assets.financial} />
        <Row label="Business-related" value={s.assets.business} />
        <Row label="Farm / fishing" value={s.assets.farm} />
        <Row label="Other property" value={s.assets.other} />
        <Row label="Total assets" value={s.assets.grand} emphasis />
      </Panel>

      <Panel
        tag="Sched. D + E/F"
        title="Liabilities"
        description="What you owe."
      >
        <Row label="Secured claims" value={s.liabilities.secured} />
        <Row label="Priority unsecured" value={s.liabilities.priority} />
        <Row label="Nonpriority unsecured" value={s.liabilities.nonpriority} />
        <Row label="Total liabilities" value={s.liabilities.grand} emphasis />
      </Panel>

      <Panel
        tag="Sched. I − J"
        title="Monthly cash flow"
        description="Income net of expenses, monthly."
      >
        <Row label="Debtor 1 take-home" value={s.income.d1Net} />
        <Row label="Debtor 2 take-home" value={s.income.d2Net} />
        <Row label="Other income" value={s.income.otherD1 + s.income.otherD2} />
        <Row label="Combined monthly income" value={s.income.combined} />
        <Row label="Monthly expenses" value={s.expenses} />
        <Row label="Monthly net income" value={s.net} emphasis />
      </Panel>
    </div>
  );
}
