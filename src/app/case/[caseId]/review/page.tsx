"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useReviewStore } from "@/state/review-store";
import { useCaseStore } from "@/state/case-store";
import { getSchema } from "@/lib/schemas";
import type { FormPatch } from "@/lib/integrations/types";

export default function ReviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const router = useRouter();
  const bundle = useReviewStore((s) => s.bundles[caseId]);
  const clearBundle = useReviewStore((s) => s.clearBundle);

  const [accepted, setAccepted] = useState<Record<string, boolean>>(() =>
    bundle ? Object.fromEntries(bundle.patches.map((p) => [p.id, true])) : {}
  );

  const groupedByForm = useMemo(() => {
    const out: Record<string, FormPatch[]> = {};
    if (!bundle) return out;
    for (const p of bundle.patches) {
      (out[p.formId] ??= []).push(p);
    }
    return out;
  }, [bundle]);

  if (!bundle) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nothing to review</h1>
        <p className="text-sm text-muted-foreground">
          Upload a document or connect a bank from the case overview to see proposed entries here.
        </p>
        <Button asChild>
          <Link href={`/case/${caseId}`}>Back to case</Link>
        </Button>
      </div>
    );
  }

  const acceptedCount = Object.values(accepted).filter(Boolean).length;

  const onApply = () => {
    const setField = useCaseStore.getState().setFieldValue;
    const append = useCaseStore.getState().appendRepeatingItem;
    const setFieldByPath = (formId: string, path: string[], value: unknown) =>
      setField(formId, path, value as never);

    for (const p of bundle.patches) {
      if (!accepted[p.id]) continue;
      if (p.op.kind === "setField") {
        setFieldByPath(p.formId, p.op.path, p.op.value);
      } else {
        // appendGroup: append a fresh row, then write each field by index.
        const formData = useCaseStore.getState().cases[caseId]?.forms[p.formId];
        const existing = Array.isArray(formData?.[p.op.groupId])
          ? (formData![p.op.groupId] as unknown[])
          : [];
        const newIndex = existing.length;
        append(p.formId, p.op.groupId);
        for (const [k, v] of Object.entries(p.op.fields)) {
          setFieldByPath(p.formId, [p.op.groupId, String(newIndex), k], v);
        }
      }
    }
    clearBundle(caseId);
    router.push(`/case/${caseId}`);
  };

  const onCancel = () => {
    clearBundle(caseId);
    router.push(`/case/${caseId}`);
  };

  const toggleAll = (value: boolean) => {
    setAccepted(
      Object.fromEntries(bundle.patches.map((p) => [p.id, value]))
    );
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Review extracted data
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Confirm before autofill
        </h1>
        <p className="text-sm text-muted-foreground">
          Source: <span className="font-medium">{bundle.doc.sourceLabel}</span> · {bundle.patches.length} proposed entries
        </p>
        {bundle.doc.rawSummary ? (
          <p className="mt-2 rounded border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {bundle.doc.rawSummary}
          </p>
        ) : null}
      </header>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Button size="sm" variant="ghost" onClick={() => toggleAll(true)}>
            Select all
          </Button>
          <Button size="sm" variant="ghost" onClick={() => toggleAll(false)}>
            Clear
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" /> Discard
          </Button>
          <Button onClick={onApply} disabled={acceptedCount === 0}>
            <Check className="h-4 w-4" /> Apply {acceptedCount} to forms
          </Button>
        </div>
      </div>

      {Object.entries(groupedByForm).map(([formId, patches]) => {
        const schema = getSchema(formId);
        return (
          <Card key={formId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Form {formId} — {schema?.title ?? "(unknown)"}
                </CardTitle>
                <Badge variant="secondary">{patches.length}</Badge>
              </div>
              <CardDescription>{schema?.longTitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {patches.map((p) => (
                  <li key={p.id} className="flex items-start gap-3 py-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={!!accepted[p.id]}
                      onChange={(e) =>
                        setAccepted((cur) => ({
                          ...cur,
                          [p.id]: e.target.checked,
                        }))
                      }
                    />
                    <div className="flex-1">
                      <p className="text-sm">{p.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.op.kind === "appendGroup"
                          ? `New row in ${p.op.groupId}`
                          : `Set ${p.op.path.join(".")}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
