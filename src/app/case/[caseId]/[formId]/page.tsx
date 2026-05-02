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
      <p className="text-sm text-muted-foreground">
        Unknown form &quot;{formId}&quot;.
      </p>
    );
  }

  const order = FORM_ORDER[record.chapter];
  const idx = order.indexOf(formId);
  const prev = idx > 0 ? order[idx - 1] : null;
  const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

  return (
    <div className="space-y-8">
      {schema.derived ? (
        <div className="space-y-6">
          <header className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Form {schema.id}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {schema.title}
            </h1>
            <p className="text-sm text-muted-foreground">{schema.longTitle}</p>
          </header>
          <SummaryView />
        </div>
      ) : (
        <FormRenderer formId={formId} />
      )}

      <nav className="flex items-center justify-between border-t border-border pt-6">
        <div>
          {prev ? (
            <Button variant="ghost" asChild>
              <Link href={`/case/${caseId}/${prev}`}>
                ← {getSchema(prev)?.title}
              </Link>
            </Button>
          ) : null}
        </div>
        <div>
          {next ? (
            <Button asChild>
              <Link href={`/case/${caseId}/${next}`}>
                {getSchema(next)?.title} →
              </Link>
            </Button>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
