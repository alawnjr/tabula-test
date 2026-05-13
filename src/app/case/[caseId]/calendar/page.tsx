"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useCaseStore } from "@/state/case-store";
import { computeDeadlines, bucketize, type Deadline } from "@/lib/estate/deadlines";

export default function CalendarPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const record = useCaseStore((s) => s.cases[caseId]);

  const buckets = useMemo(() => {
    if (!record) return { overdue: [], thisMonth: [], upcoming: [] };
    return bucketize(computeDeadlines(record));
  }, [record]);

  if (!record) return null;

  if (record.chapter !== "estateAdmin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Calendar is available only for estate-administration cases.
        </p>
        <Link
          href={`/case/${caseId}`}
          className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← Case overview
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8 space-y-8">
      <header className="space-y-2">
        <span className="tag">Compliance calendar</span>
        <h1
          className="text-[32px] leading-[1.04] tracking-[-0.025em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          <em>Deadlines</em>
        </h1>
        <p className="text-[13px] font-light text-[var(--ink-2)]">
          Derived from date of death, domicile state, and the elections recorded
          on the tax-coordination form. Independent of any work logged elsewhere
          in the case.
        </p>
      </header>

      <Bucket title="Overdue" items={buckets.overdue} emptyText="Nothing overdue." />
      <Bucket title="Next 30 days" items={buckets.thisMonth} emptyText="Nothing due in the next 30 days." />
      <Bucket title="Upcoming" items={buckets.upcoming} emptyText="No upcoming deadlines computed." />
    </div>
  );
}

function Bucket({ title, items, emptyText }: { title: string; items: Deadline[]; emptyText: string }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between border-b border-[var(--rule)] pb-2">
        <span className="tag">{title}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          {emptyText}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--rule-soft)]">
          {items.map((d) => (
            <li key={d.id} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="text-[15px] tracking-[-0.015em] text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  {d.label}
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  {new Date(d.dueISO).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[var(--ink-2)]">{d.basis}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <SeverityBadge severity={d.severity} />
                <JurisdictionBadge jurisdiction={d.jurisdiction} />
                {d.dependsOn?.length ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                    depends on {d.dependsOn.join(", ")}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SeverityBadge({ severity }: { severity: Deadline["severity"] }) {
  const label =
    severity === "hard" ? "Hard deadline" : severity === "soft" ? "Soft target" : "Informational";
  return (
    <span
      className={
        "rounded-[2px] border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] " +
        (severity === "hard"
          ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
          : "border-[var(--rule)] text-[var(--mute)]")
      }
    >
      {label}
    </span>
  );
}

function JurisdictionBadge({ jurisdiction }: { jurisdiction: Deadline["jurisdiction"] }) {
  return (
    <span className="rounded-[2px] border border-[var(--rule)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
      {jurisdiction}
    </span>
  );
}
