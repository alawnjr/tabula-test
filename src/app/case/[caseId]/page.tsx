"use client";

import Link from "next/link";
import { use } from "react";
import { useCaseStore } from "@/state/case-store";
import { FORM_ORDER, getSchema } from "@/lib/schemas";
import { SummaryView } from "@/components/case/SummaryView";
import { IntegrationsPanel } from "@/components/case/IntegrationsPanel";

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
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Case overview
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {record.debtorName || "Untitled debtor"}
        </h1>
      </header>

      <IntegrationsPanel caseId={caseId} />

      <SummaryView />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Forms in this case
        </h2>
        <ul className="grid gap-2 md:grid-cols-2">
          {ids.map((id) => {
            const s = getSchema(id);
            if (!s) return null;
            return (
              <li key={id}>
                <Link
                  href={`/case/${caseId}/${id}`}
                  className="block rounded-md border border-border bg-card px-4 py-3 transition hover:border-foreground/30"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Form {s.id}
                  </p>
                  <p className="text-sm font-medium">{s.title}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
