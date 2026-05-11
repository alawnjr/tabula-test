"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useReviewStore } from "@/state/review-store";
import { useCaseStore } from "@/state/case-store";
import { FORM_ORDER, getSchema } from "@/lib/schemas";
import type {
  BankTransaction,
  ExtractedDoc,
  FormPatch,
} from "@/lib/integrations/types";

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function summarizeTransactions(txs: BankTransaction[]): {
  inflow: number;
  outflow: number;
  monthlyAvgIn: number;
  monthlyAvgOut: number;
  monthCount: number;
} {
  let inflow = 0;
  let outflow = 0;
  const months = new Set<string>();
  for (const t of txs) {
    if (t.amount >= 0) inflow += t.amount;
    else outflow += -t.amount;
    months.add(t.date.slice(0, 7));
  }
  const monthCount = Math.max(1, months.size);
  return {
    inflow,
    outflow,
    monthlyAvgIn: inflow / monthCount,
    monthlyAvgOut: outflow / monthCount,
    monthCount,
  };
}

// What the editor returns when the user changes a value. We let users edit
// strings, numbers, and booleans inline. The shape preserves the original
// FormPatch op kind so applying just routes to the same store action.
type PatchEditOp = FormPatch["op"];

function coerceValue(prev: unknown, raw: string): unknown {
  if (typeof prev === "number") {
    if (raw.trim() === "") return 0;
    const n = Number(raw.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof prev === "boolean") {
    return raw === "true";
  }
  return raw;
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const router = useRouter();
  const rawBundle = useReviewStore((s) => s.bundles[caseId]);
  const updatePatch = useReviewStore((s) => s.updatePatch);
  const removePatch = useReviewStore((s) => s.removePatch);
  const removeDocByLabel = useReviewStore((s) => s.removeDocByLabel);
  const clearBundle = useReviewStore((s) => s.clearBundle);
  const caseChapter = useCaseStore((s) => s.cases[caseId]?.chapter);

  // Hide patches that target forms outside this case's chapter — e.g. a
  // pay-stub upload in a means-test case generates 106I patches we shouldn't
  // surface there. The same data does become relevant after branching to
  // Chapter 7, since the new case copies forms over.
  const bundle = useMemo(() => {
    if (!rawBundle || !caseChapter) return rawBundle;
    const allowed = new Set(FORM_ORDER[caseChapter] ?? []);
    const patches = rawBundle.patches.filter((p) => allowed.has(p.formId));
    return { docs: rawBundle.docs, patches };
  }, [rawBundle, caseChapter]);

  const [accepted, setAccepted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((bundle?.patches ?? []).map((p) => [p.id, true]))
  );

  // Newly-arriving patches default to accepted=true; patches that have been
  // removed from the bundle are dropped from the accepted map.
  const allPatchIds = useMemo(
    () => bundle?.patches.map((p) => p.id) ?? [],
    [bundle]
  );
  useEffect(() => {
    setAccepted((prev) => {
      const next = { ...prev };
      let changed = false;
      const idSet = new Set(allPatchIds);
      for (const id of allPatchIds) {
        if (!(id in next)) {
          next[id] = true;
          changed = true;
        }
      }
      for (const k of Object.keys(next)) {
        if (!idSet.has(k)) {
          delete next[k];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [allPatchIds]);

  const groupedByForm = useMemo(() => {
    const out: Record<string, FormPatch[]> = {};
    if (!bundle) return out;
    for (const p of bundle.patches) {
      (out[p.formId] ??= []).push(p);
    }
    return out;
  }, [bundle]);

  // Aggregate transactions across every doc that brought any.
  const transactions = useMemo(() => {
    if (!bundle) return [] as BankTransaction[];
    const all: BankTransaction[] = [];
    for (const d of bundle.docs) {
      if (d.transactions?.length) all.push(...d.transactions);
    }
    return all;
  }, [bundle]);
  const txSummary = useMemo(
    () => (transactions.length ? summarizeTransactions(transactions) : null),
    [transactions]
  );
  const recentTransactions = useMemo(
    () => transactions.slice(0, 10),
    [transactions]
  );

  if (!bundle || bundle.patches.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8 space-y-4">
        <header className="space-y-2">
          <span className="tag">Review queue</span>
          <h1
            className="text-[26px] leading-[1.05] tracking-[-0.025em] text-[var(--ink)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            Nothing to review
          </h1>
          <p className="max-w-[60ch] text-[13px] text-[var(--mute)]">
            Upload one or more documents or connect a bank from the data room
            to see proposed entries here.
          </p>
        </header>
        <Button asChild>
          <Link href={`/case/${caseId}/data`}>Open data room</Link>
        </Button>
      </div>
    );
  }

  const acceptedCount = bundle.patches.filter(
    (p) => accepted[p.id]
  ).length;

  const applyPatch = (p: FormPatch) => {
    const setField = useCaseStore.getState().setFieldValue;
    const append = useCaseStore.getState().appendRepeatingItem;
    const mark = useCaseStore.getState().markAutofilled;
    const markInfo = {
      source: p.source,
      sourceLabel: p.sourceLabel,
      appliedAt: new Date().toISOString(),
    };
    if (p.op.kind === "setField") {
      setField(p.formId, p.op.path, p.op.value as never);
      mark(p.formId, p.op.path, markInfo);
    } else {
      const formData = useCaseStore.getState().cases[caseId]?.forms[p.formId];
      const existing = Array.isArray(formData?.[p.op.groupId])
        ? (formData![p.op.groupId] as unknown[])
        : [];
      const newIndex = existing.length;
      append(p.formId, p.op.groupId);
      for (const [k, v] of Object.entries(p.op.fields)) {
        const fieldPath = [p.op.groupId, String(newIndex), k];
        setField(p.formId, fieldPath, v as never);
        mark(p.formId, fieldPath, markInfo);
      }
    }
  };

  const onApply = () => {
    for (const p of bundle.patches) {
      if (!accepted[p.id]) continue;
      applyPatch(p);
    }
    clearBundle(caseId);
    router.push(`/case/${caseId}`);
  };

  const onDiscardAll = () => {
    if (
      !confirm(
        "Discard the entire review queue? Uploaded documents and bank pulls will be removed."
      )
    )
      return;
    clearBundle(caseId);
    router.push(`/case/${caseId}`);
  };

  const toggleAll = (value: boolean) => {
    setAccepted(
      Object.fromEntries(bundle.patches.map((p) => [p.id, value]))
    );
  };

  const handleEditScalar = (p: FormPatch, raw: string) => {
    if (p.op.kind !== "setField") return;
    const value = coerceValue(p.op.value, raw);
    const op: PatchEditOp = { ...p.op, value };
    updatePatch(caseId, p.id, op);
  };

  const handleEditGroupField = (
    p: FormPatch,
    fieldKey: string,
    raw: string
  ) => {
    if (p.op.kind !== "appendGroup") return;
    const prev = p.op.fields[fieldKey];
    const value = coerceValue(prev, raw);
    const op: PatchEditOp = {
      ...p.op,
      fields: { ...p.op.fields, [fieldKey]: value },
    };
    updatePatch(caseId, p.id, op);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8 space-y-6">
      <header className="space-y-2">
        <span className="tag">Review queue</span>
        <h1
          className="text-[28px] leading-[1.05] tracking-[-0.025em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          Confirm before <em className="text-[var(--mute)]">autofill.</em>
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          {bundle.docs.length} {bundle.docs.length === 1 ? "source" : "sources"}{" "}
          · {bundle.patches.length} proposed entries
        </p>
      </header>

      <SourcesPanel
        docs={bundle.docs}
        patches={bundle.patches}
        onRemove={(label) => {
          if (!confirm(`Remove ${label} and its proposed entries?`)) return;
          removeDocByLabel(caseId, label);
        }}
      />

      <div className="flex items-center justify-between gap-2 border-y border-[var(--rule-soft)] py-2">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => toggleAll(true)}>
            Select all
          </Button>
          <Button size="sm" variant="ghost" onClick={() => toggleAll(false)}>
            Clear
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onDiscardAll}>
            <X className="h-3 w-3" /> Discard all
          </Button>
          <Button onClick={onApply} disabled={acceptedCount === 0}>
            <Check className="h-3 w-3" /> Apply {acceptedCount} to forms
          </Button>
        </div>
      </div>

      {txSummary ? (
        <section className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)]">
          <header className="flex items-center justify-between border-b border-[var(--rule-soft)] px-4 py-3">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                Bank transactions · {transactions.length}
              </span>
              <h3
                className="mt-0.5 text-[15px] tracking-[-0.015em] text-[var(--ink)]"
                style={{ fontFamily: "var(--serif)" }}
              >
                Pulled history
              </h3>
            </div>
          </header>
          <div className="space-y-4 px-4 py-3">
            <p className="text-[11px] text-[var(--mute)]">
              Pulled from connected accounts. Use these for the means test
              (122A-1) and Schedules I/J — not auto-applied.
            </p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
              <Stat
                label="Total inflow"
                value={formatCurrency(txSummary.inflow)}
              />
              <Stat
                label="Total outflow"
                value={formatCurrency(txSummary.outflow)}
              />
              <Stat
                label={`Avg in (${txSummary.monthCount}mo)`}
                value={formatCurrency(txSummary.monthlyAvgIn)}
              />
              <Stat
                label="Avg out"
                value={formatCurrency(txSummary.monthlyAvgOut)}
              />
            </div>
            {recentTransactions.length ? (
              <div>
                <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  Most recent
                </p>
                <ul className="divide-y divide-[var(--rule-soft)]">
                  {recentTransactions.map((t, i) => (
                    <li
                      key={`${t.accountId}-${t.date}-${i}`}
                      className="flex items-baseline justify-between gap-3 py-1.5 text-[12.5px]"
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[13px] text-[var(--ink)]"
                          style={{ fontFamily: "var(--serif)" }}
                        >
                          {t.description}
                        </span>
                        <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
                          {t.date}
                          {t.accountLast4 ? ` · ***${t.accountLast4}` : ""}
                          {t.category ? ` · ${t.category}` : ""}
                          {t.status === "pending" ? " · pending" : ""}
                        </span>
                      </span>
                      <span
                        className={
                          "shrink-0 font-medium tabular-nums " +
                          (t.amount >= 0
                            ? "text-[var(--accent-deep)]"
                            : "text-[var(--ink)]")
                        }
                      >
                        {formatCurrency(t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
                {transactions.length > recentTransactions.length ? (
                  <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                    + {transactions.length - recentTransactions.length} more in
                    pull
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {Object.entries(groupedByForm).map(([formId, patches]) => {
        const schema = getSchema(formId);
        return (
          <section
            key={formId}
            className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)]"
          >
            <header className="flex items-center justify-between gap-3 border-b border-[var(--rule-soft)] px-4 py-3">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  Form {formId}
                </span>
                <h3
                  className="mt-0.5 text-[15px] tracking-[-0.015em] text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  {schema?.title ?? "(unknown)"}
                </h3>
                {schema?.longTitle ? (
                  <p className="mt-0.5 text-[11px] text-[var(--mute)]">
                    {schema.longTitle}
                  </p>
                ) : null}
              </div>
              <Badge variant="ink">{patches.length}</Badge>
            </header>
            <ul className="divide-y divide-[var(--rule-soft)] px-4">
              {patches.map((p) => (
                <PatchRow
                  key={p.id}
                  patch={p}
                  accepted={!!accepted[p.id]}
                  onAccept={(v) =>
                    setAccepted((cur) => ({ ...cur, [p.id]: v }))
                  }
                  onEditScalar={(raw) => handleEditScalar(p, raw)}
                  onEditGroupField={(k, raw) =>
                    handleEditGroupField(p, k, raw)
                  }
                  onRemove={() => removePatch(caseId, p.id)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function PatchRow({
  patch,
  accepted,
  onAccept,
  onEditScalar,
  onEditGroupField,
  onRemove,
}: {
  patch: FormPatch;
  accepted: boolean;
  onAccept: (v: boolean) => void;
  onEditScalar: (raw: string) => void;
  onEditGroupField: (key: string, raw: string) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="space-y-2 py-2">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-1 h-3.5 w-3.5 accent-[var(--ink)]"
          checked={accepted}
          onChange={(e) => onAccept(e.target.checked)}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] tracking-[-0.005em] text-[var(--ink)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            {patch.label}
          </p>
          <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
            {patch.op.kind === "appendGroup"
              ? `New row · ${patch.op.groupId}`
              : `Set ${patch.op.path.join(".")}`}{" "}
            · {patch.sourceLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Done" : "Edit"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onRemove}
            aria-label="Remove patch"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {open ? (
        <div className="rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper)] p-3">
          {patch.op.kind === "setField" ? (
            <ScalarEditor
              path={patch.op.path}
              value={patch.op.value}
              onChange={onEditScalar}
            />
          ) : (
            <GroupEditor
              fields={patch.op.fields}
              onChange={onEditGroupField}
            />
          )}
        </div>
      ) : null}
    </li>
  );
}

function ScalarEditor({
  path,
  value,
  onChange,
}: {
  path: string[];
  value: unknown;
  onChange: (raw: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
        {path.join(".")}
      </span>
      <Input
        defaultValue={value == null ? "" : String(value)}
        onBlur={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function GroupEditor({
  fields,
  onChange,
}: {
  fields: Record<string, unknown>;
  onChange: (key: string, raw: string) => void;
}) {
  const entries = Object.entries(fields);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {entries.map(([key, value]) => (
        <label key={key} className="block space-y-1">
          <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
            {key}
          </span>
          <Input
            defaultValue={value == null ? "" : String(value)}
            onBlur={(e) => onChange(key, e.target.value)}
          />
        </label>
      ))}
    </div>
  );
}

function SourcesPanel({
  docs,
  patches,
  onRemove,
}: {
  docs: ExtractedDoc[];
  patches: FormPatch[];
  onRemove: (sourceLabel: string) => void;
}) {
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const p of patches) {
      out[p.sourceLabel] = (out[p.sourceLabel] ?? 0) + 1;
    }
    return out;
  }, [patches]);

  return (
    <section className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)]">
      <header className="flex items-center justify-between border-b border-[var(--rule-soft)] px-4 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Source documents
        </span>
        <Badge variant="outline">{docs.length}</Badge>
      </header>
      <ul className="divide-y divide-[var(--rule-soft)] px-4">
        {docs.map((d) => (
          <li
            key={d.sourceLabel + d.extractedAt}
            className="flex items-baseline justify-between gap-3 py-2"
          >
            <span className="min-w-0 flex-1">
              <span
                className="block truncate text-[13px] tracking-[-0.005em] text-[var(--ink)]"
                style={{ fontFamily: "var(--serif)" }}
              >
                {d.sourceLabel}
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
                {d.source} ·{" "}
                {new Date(d.extractedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                · {counts[d.sourceLabel] ?? 0} entries
              </span>
              {d.rawSummary ? (
                <span
                  className="mt-1 block max-w-[60ch] text-[12px] italic text-[var(--ink-2)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  {d.rawSummary}
                </span>
              ) : null}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(d.sourceLabel)}
              aria-label={`Remove ${d.sourceLabel}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
        {label}
      </p>
      <p
        className="mt-0.5 text-[16px] tracking-[-0.015em] text-[var(--ink)] tabular-nums"
        style={{ fontFamily: "var(--serif)" }}
      >
        {value}
      </p>
    </div>
  );
}
