"use client";

import Link from "next/link";
import { use } from "react";
import { useCaseStore } from "@/state/case-store";
import { FORM_ORDER, getSchema } from "@/lib/schemas";
import { SummaryView } from "@/components/case/SummaryView";

export default function CaseOverviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const record = useCaseStore((s) => s.cases[caseId]);
  if (!record) return null;
  const ids = FORM_ORDER[record.chapter];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8 space-y-8">
      <header className="space-y-2">
        <span className="tag">Case overview</span>
        <h1
          className="text-[32px] leading-[1.04] tracking-[-0.025em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          {record.debtorName || (
            <em className="text-[var(--mute)]">Untitled debtor</em>
          )}
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          № {record.id.slice(-6).toUpperCase()} ·{" "}
          {new Date(record.updatedAt).toLocaleDateString(undefined, {
            dateStyle: "medium",
          })}
        </p>
      </header>

      <SummaryView />

      <section className="space-y-3">
        <div className="flex items-end justify-between border-b border-[var(--rule)] pb-2">
          <span className="tag">Forms in this case</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
            {ids.length} schedules
          </span>
        </div>

        <ul className="divide-y divide-[var(--rule-soft)]">
          {ids.map((id, i) => {
            const s = getSchema(id);
            if (!s) return null;
            return (
              <li key={id}>
                <Link
                  href={`/case/${caseId}/${id}`}
                  className="group flex items-baseline justify-between gap-3 py-2.5 transition-colors"
                >
                  <span className="flex items-baseline gap-3 min-w-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] shrink-0">
                      № {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--mute)]">
                        Form {s.id}
                      </span>
                      <span
                        className="block truncate text-[15px] tracking-[-0.015em] text-[var(--ink)] group-hover:text-[var(--accent-deep)]"
                        style={{ fontFamily: "var(--serif)" }}
                      >
                        {s.title}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] group-hover:text-[var(--ink)]">
                    Open →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
