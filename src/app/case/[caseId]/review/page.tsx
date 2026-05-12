"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useReviewStore } from "@/state/review-store";
import { useCaseStore } from "@/state/case-store";
import { FORM_ORDER, getSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
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
  const addDoc = useReviewStore((s) => s.addDoc);
  const updatePatch = useReviewStore((s) => s.updatePatch);
  const removePatch = useReviewStore((s) => s.removePatch);
  const removeDocByLabel = useReviewStore((s) => s.removeDocByLabel);
  const clearBundle = useReviewStore((s) => s.clearBundle);
  const caseChapter = useCaseStore((s) => s.cases[caseId]?.chapter);
  const debtorUploads = useQuery(api.cases.getDebtorUploads, { id: caseId as Id<"cases"> });
  const clearDebtorUploads = useMutation(api.cases.clearDebtorUploads);
  const markUploadReviewed = useMutation(api.cases.markUploadReviewed);
  const updateUploadPatches = useMutation(api.cases.updateUploadPatches);

  // Tracks uploads accepted this session so the sync effect doesn't re-add them
  // during the window between removeDocByLabel and Convex processing markUploadReviewed.
  const locallyReviewed = useRef<Set<string>>(new Set());

  // Sync Convex uploads into the review store on initial load and when new uploads arrive.
  // Skips: already-reviewed (Convex flag), locally-accepted (ref), already-in-store (no overwrite).
  useEffect(() => {
    if (!debtorUploads?.length) return;
    const currentDocs = useReviewStore.getState().bundles[caseId]?.docs ?? [];
    const existingLabels = new Set(currentDocs.map((d) => d.sourceLabel));
    for (const upload of debtorUploads) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((upload as any).reviewed) continue;
      if (locallyReviewed.current.has((upload as any).uploadedAt)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const label = (upload as any).extractedDoc?.sourceLabel;
      if (label && existingLabels.has(label)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addDoc(caseId, { doc: upload.extractedDoc as any, patches: upload.patches as any });
    }
  }, [debtorUploads, caseId, addDoc]);

  const bundle = useMemo(() => {
    if (!rawBundle || !caseChapter) return rawBundle;
    const allowed = new Set(FORM_ORDER[caseChapter] ?? []);
    const patches = rawBundle.patches.filter((p) => allowed.has(p.formId));
    return { docs: rawBundle.docs, patches };
  }, [rawBundle, caseChapter]);

  const [accepted, setAccepted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((bundle?.patches ?? []).map((p) => [p.id, true]))
  );

  // Track which upload is being previewed (by uploadedAt key)
  const [previewUploadedAt, setPreviewUploadedAt] = useState<string | null>(null);

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

  // Auto-open the first upload that has a stored file
  useEffect(() => {
    if (previewUploadedAt || !debtorUploads?.length) return;
    const first = debtorUploads.find((u) => u.storageId);
    if (first) setPreviewUploadedAt(first.uploadedAt);
  }, [debtorUploads]); // eslint-disable-line react-hooks/exhaustive-deps

  // Source label for the currently previewed upload
  const previewSourceLabel = useMemo(() => {
    if (!previewUploadedAt || !debtorUploads?.length) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = debtorUploads.find((u: any) => u.uploadedAt === previewUploadedAt);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (u as any)?.extractedDoc?.sourceLabel ?? null;
  }, [previewUploadedAt, debtorUploads]);

  // When the previewed doc changes, check only that doc's patches
  useEffect(() => {
    if (!previewSourceLabel || !bundle?.patches.length) return;
    setAccepted(
      Object.fromEntries(bundle.patches.map((p) => [p.id, p.sourceLabel === previewSourceLabel]))
    );
    // Intentionally omit bundle — only re-run when the selected doc changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewSourceLabel]);

  const groupedByForm = useMemo(() => {
    const out: Record<string, FormPatch[]> = {};
    if (!bundle) return out;
    for (const p of bundle.patches) {
      (out[p.formId] ??= []).push(p);
    }
    return out;
  }, [bundle]);

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
    const acceptedList = bundle.patches.filter((p) => accepted[p.id]);
    if (acceptedList.length === 0) return;

    for (const p of acceptedList) applyPatch(p);

    const remainingPatches = bundle.patches.filter((p) => !accepted[p.id]);

    if (remainingPatches.length === 0) {
      for (const doc of bundle.docs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const up = debtorUploads?.find((u: any) => u.extractedDoc?.sourceLabel === doc.sourceLabel) as any;
        if (up?.uploadedAt) {
          locallyReviewed.current.add(up.uploadedAt);
          void markUploadReviewed({ id: caseId as Id<"cases">, uploadedAt: up.uploadedAt });
        }
      }
      clearBundle(caseId);
      router.push(`/case/${caseId}`);
      return;
    }

    const remainingLabelSet = new Set(remainingPatches.map((p) => p.sourceLabel));

    // Docs whose patches were all accepted: mark reviewed
    for (const doc of bundle.docs) {
      if (!remainingLabelSet.has(doc.sourceLabel)) {
        removeDocByLabel(caseId, doc.sourceLabel);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const up = debtorUploads?.find((u: any) => u.extractedDoc?.sourceLabel === doc.sourceLabel) as any;
        if (up?.uploadedAt) {
          locallyReviewed.current.add(up.uploadedAt);
          void markUploadReviewed({ id: caseId as Id<"cases">, uploadedAt: up.uploadedAt });
        }
      }
    }

    // Partially accepted docs: remove accepted patches from local store and
    // update the Convex record so the queue restores correctly on reload.
    const partialLabelPatches: Record<string, typeof remainingPatches> = {};
    for (const p of acceptedList) {
      if (remainingLabelSet.has(p.sourceLabel)) removePatch(caseId, p.id);
    }
    for (const label of remainingLabelSet) {
      partialLabelPatches[label] = remainingPatches.filter(p => p.sourceLabel === label);
    }
    for (const [label, leftover] of Object.entries(partialLabelPatches)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const up = debtorUploads?.find((u: any) => u.extractedDoc?.sourceLabel === label);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((up as any)?.uploadedAt) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        void updateUploadPatches({ id: caseId as Id<"cases">, uploadedAt: (up as any).uploadedAt, patches: leftover });
      }
    }

    // Advance preview to next doc that has a viewable file
    if (previewSourceLabel && !remainingLabelSet.has(previewSourceLabel)) {
      let nextUploadedAt: string | null = null;
      for (const doc of bundle.docs) {
        if (!remainingLabelSet.has(doc.sourceLabel)) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const up = debtorUploads?.find((u: any) => u.extractedDoc?.sourceLabel === doc.sourceLabel && u.storageId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((up as any)?.uploadedAt) { nextUploadedAt = (up as any).uploadedAt; break; }
      }
      setPreviewUploadedAt(nextUploadedAt);
    }

    // Default all remaining patches to accepted=true for next pass
    setAccepted(Object.fromEntries(remainingPatches.map((p) => [p.id, true])));
  };

  const onAcceptAll = () => {
    for (const p of bundle.patches) {
      applyPatch(p);
    }
    for (const doc of bundle.docs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const up = debtorUploads?.find((u: any) => u.extractedDoc?.sourceLabel === doc.sourceLabel) as any;
      if (up?.uploadedAt) {
        locallyReviewed.current.add(up.uploadedAt);
        void markUploadReviewed({ id: caseId as Id<"cases">, uploadedAt: up.uploadedAt });
      }
    }
    clearBundle(caseId);
    router.push(`/case/${caseId}`);
  };

  const onAcceptCurrentDoc = () => {
    if (!previewUploadedAt || !previewSourceLabel) return;
    for (const p of bundle.patches) {
      if (p.sourceLabel === previewSourceLabel) applyPatch(p);
    }
    removeDocByLabel(caseId, previewSourceLabel);
    locallyReviewed.current.add(previewUploadedAt);
    void markUploadReviewed({ id: caseId as Id<"cases">, uploadedAt: previewUploadedAt });
    // Advance to the next doc that has a viewable file, or navigate away
    const remaining = bundle.docs.filter((d) => d.sourceLabel !== previewSourceLabel);
    let nextUploadedAt: string | null = null;
    for (const doc of remaining) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const up = debtorUploads?.find((u: any) => u.extractedDoc?.sourceLabel === doc.sourceLabel && u.storageId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((up as any)?.uploadedAt) { nextUploadedAt = (up as any).uploadedAt; break; }
    }
    if (nextUploadedAt) {
      setPreviewUploadedAt(nextUploadedAt);
    } else if (remaining.length > 0) {
      setPreviewUploadedAt(null); // remaining docs have no viewable file
    } else {
      router.push(`/case/${caseId}`);
    }
  };

  const onDiscardAll = () => {
    if (
      !confirm(
        "Discard the entire review queue? Uploaded documents and bank pulls will be removed."
      )
    )
      return;
    clearBundle(caseId);
    void clearDebtorUploads({ id: caseId as Id<"cases"> });
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

  const hasPreview = Boolean(previewUploadedAt);

  const reviewContent = (
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
        debtorUploads={debtorUploads ?? []}
        previewUploadedAt={previewUploadedAt}
        onPreview={setPreviewUploadedAt}
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
          <Button variant="outline" onClick={onAcceptAll}>
            <Check className="h-3 w-3" /> Accept all
          </Button>
          <Button onClick={onApply} disabled={acceptedCount === 0}>
            <Check className="h-3 w-3" /> Apply {acceptedCount} selected
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
              <Stat label="Total inflow" value={formatCurrency(txSummary.inflow)} />
              <Stat label="Total outflow" value={formatCurrency(txSummary.outflow)} />
              <Stat label={`Avg in (${txSummary.monthCount}mo)`} value={formatCurrency(txSummary.monthlyAvgIn)} />
              <Stat label="Avg out" value={formatCurrency(txSummary.monthlyAvgOut)} />
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
                    + {transactions.length - recentTransactions.length} more in pull
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

  return (
    <div
      className={cn(
        "flex",
        hasPreview && "h-[calc(100vh-var(--case-header-h))] overflow-hidden"
      )}
    >
      <div className={cn(hasPreview && "flex-1 min-w-0 overflow-y-auto")}>
        {reviewContent}
      </div>

      {hasPreview && previewUploadedAt && (
        <div className="w-[48%] shrink-0 border-l border-[var(--rule)] overflow-hidden flex flex-col">
          <DocViewer
            caseId={caseId}
            uploadedAt={previewUploadedAt}
            onClose={() => setPreviewUploadedAt(null)}
            onAcceptDoc={onAcceptCurrentDoc}
            docPatchCount={
              previewSourceLabel
                ? bundle.patches.filter((p) => p.sourceLabel === previewSourceLabel).length
                : 0
            }
          />
        </div>
      )}
    </div>
  );
}

function DocViewer({
  caseId,
  uploadedAt,
  onClose,
  onAcceptDoc,
  docPatchCount,
}: {
  caseId: string;
  uploadedAt: string;
  onClose: () => void;
  onAcceptDoc: () => void;
  docPatchCount: number;
}) {
  const url = useQuery(api.cases.getUploadFileUrl, {
    id: caseId as Id<"cases">,
    uploadedAt,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--rule-soft)] px-3 py-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Source document
        </span>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={onAcceptDoc} disabled={docPatchCount === 0}>
            <Check className="h-3 w-3" />
            Accept this doc ({docPatchCount})
          </Button>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
            >
              <ExternalLink className="h-3 w-3" />
              Open
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
          >
            ✕ Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-[var(--paper-3)]">
        {url === undefined ? (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
              Loading…
            </span>
          </div>
        ) : url === null ? (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
              File not available
            </span>
          </div>
        ) : (
          <iframe
            src={url}
            className="h-full w-full border-0"
            title="Source document"
          />
        )}
      </div>
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
  debtorUploads,
  previewUploadedAt,
  onPreview,
  onRemove,
}: {
  docs: ExtractedDoc[];
  patches: FormPatch[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debtorUploads: any[];
  previewUploadedAt: string | null;
  onPreview: (uploadedAt: string | null) => void;
  onRemove: (sourceLabel: string) => void;
}) {
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const p of patches) {
      out[p.sourceLabel] = (out[p.sourceLabel] ?? 0) + 1;
    }
    return out;
  }, [patches]);

  // Map sourceLabel → uploadedAt for docs that have a stored file
  const labelToUploadedAt = useMemo(() => {
    const out: Record<string, string> = {};
    for (const u of debtorUploads) {
      if (u.storageId && u.extractedDoc?.sourceLabel) {
        out[u.extractedDoc.sourceLabel] = u.uploadedAt;
      }
    }
    return out;
  }, [debtorUploads]);

  return (
    <section className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)]">
      <header className="flex items-center justify-between border-b border-[var(--rule-soft)] px-4 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Source documents
        </span>
        <Badge variant="outline">{docs.length}</Badge>
      </header>
      <ul className="divide-y divide-[var(--rule-soft)]">
        {docs.map((d) => {
          const uploadedAt = labelToUploadedAt[d.sourceLabel];
          const isPreviewing = uploadedAt != null && previewUploadedAt === uploadedAt;
          return (
            <li
              key={d.sourceLabel + d.extractedAt}
              className={cn(
                "flex items-start justify-between gap-3 py-2 px-4 transition-colors",
                isPreviewing && "bg-[var(--paper-3)]"
              )}
            >
              <button
                type="button"
                disabled={!uploadedAt}
                onClick={() => uploadedAt && onPreview(uploadedAt)}
                className="min-w-0 flex-1 text-left disabled:cursor-default"
              >
                <span
                  className={cn(
                    "block truncate text-[13px] tracking-[-0.005em]",
                    isPreviewing ? "text-[var(--ink)]" : "text-[var(--ink)] hover:text-[var(--accent-deep)]"
                  )}
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
              </button>
              <div className="flex shrink-0 items-center gap-1 pt-0.5">
                {uploadedAt && isPreviewing && (
                  <button
                    type="button"
                    onClick={() => onPreview(null)}
                    className="rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
                  >
                    Hide
                  </button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(d.sourceLabel)}
                  aria-label={`Remove ${d.sourceLabel}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </li>
          );
        })}
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
