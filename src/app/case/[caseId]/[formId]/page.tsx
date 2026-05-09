"use client";

import Link from "next/link";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { useCaseStore } from "@/state/case-store";
import { FORM_ORDER, getSchema } from "@/lib/schemas";
import { FormRenderer } from "@/components/form-renderer/FormRenderer";
import { SummaryView } from "@/components/case/SummaryView";

export default function CaseFormPage({
  params,
}: {
  params: Promise<{ caseId: string; formId: string }>;
}) {
  const { caseId, formId } = use(params);
  const record = useCaseStore((s) => s.cases[caseId]);
  if (!record) return null;

  const schema = getSchema(formId);
  if (!schema) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
        <p className="text-[13px] text-[var(--mute)]">
          Unknown form &quot;{formId}&quot;.
        </p>
      </div>
    );
  }

  const order = FORM_ORDER[record.chapter];
  const idx = order.indexOf(formId);
  const prev = idx > 0 ? order[idx - 1] : null;
  const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

  const formNav = (
    <nav className="flex items-center justify-between">
      <div>
        {prev ? (
          <Button variant="ghost" asChild>
            <Link href={`/case/${caseId}/${prev}`}>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
                ← Prev form
              </span>
              <span
                className="ml-2 text-[12.5px]"
                style={{ fontFamily: "var(--serif)" }}
              >
                {getSchema(prev)?.title}
              </span>
            </Link>
          </Button>
        ) : null}
      </div>
      <div>
        {next ? (
          <Button asChild>
            <Link href={`/case/${caseId}/${next}`}>
              <span style={{ fontFamily: "var(--serif)" }}>
                {getSchema(next)?.title}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
                →
              </span>
            </Link>
          </Button>
        ) : null}
      </div>
    </nav>
  );

  if (schema.derived) {
    return (
      <div>
        <div
          className="sticky z-20 border-b border-[var(--rule)] bg-[var(--paper)]"
          style={{ top: "var(--case-header-h)" }}
        >
          <div className="flex items-baseline justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] shrink-0">
                Form {schema.id} · Auto
              </span>
              <h1
                className="text-[18px] tracking-[-0.015em] text-[var(--ink)] truncate"
                style={{ fontFamily: "var(--serif)" }}
              >
                {schema.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 pt-10 pb-14 lg:px-8 lg:pt-12 space-y-6">
          {schema.longTitle ? (
            <p className="max-w-[60ch] text-[12.5px] leading-relaxed text-[var(--mute)]">
              {schema.longTitle}
            </p>
          ) : null}
          <SummaryView />
          <div className="border-t border-[var(--rule)] pt-4">{formNav}</div>
        </div>
      </div>
    );
  }

  return <FormRenderer formId={formId} footer={formNav} />;
}
