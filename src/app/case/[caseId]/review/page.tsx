"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReviewStore } from "@/state/review-store";
import { useCaseStore } from "@/state/case-store";
import { getSchema } from "@/lib/schemas";
import type { BankTransaction, FormPatch } from "@/lib/integrations/types";

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

  const transactions = useMemo(
    () => bundle?.doc.transactions ?? [],
    [bundle]
  );
  const txWindow = bundle?.doc.transactionWindow;
  const txSummary = useMemo(
    () => (transactions.length ? summarizeTransactions(transactions) : null),
    [transactions]
  );
  const recentTransactions = useMemo(() => transactions.slice(0, 10), [transactions]);

  if (!bundle) {
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
            Upload a document or connect a bank from the case overview to see
            proposed entries here.
          </p>
        </header>
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
    setAccepted(Object.fromEntries(bundle.patches.map((p) => [p.id, value])));
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
          {bundle.doc.sourceLabel} · {bundle.patches.length} proposed entries
        </p>
        {bundle.doc.rawSummary ? (
          <p
            className="mt-2 max-w-[70ch] rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper-2)] px-3 py-2 text-[12.5px] italic text-[var(--ink-2)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            {bundle.doc.rawSummary}
          </p>
        ) : null}
      </header>

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
          <Button variant="ghost" onClick={onCancel}>
            <X className="h-3 w-3" /> Discard
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
            {txWindow ? (
              <Badge variant="outline">
                {txWindow.fromISO} → {txWindow.toISO}
              </Badge>
            ) : null}
          </header>
          <div className="space-y-4 px-4 py-3">
            <p className="text-[11px] text-[var(--mute)]">
              Pulled from connected accounts. Use these for the means test
              (122A-1) and Schedules I/J — not auto-applied.
            </p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
              <Stat label="Total inflow" value={formatCurrency(txSummary.inflow)} />
              <Stat label="Total outflow" value={formatCurrency(txSummary.outflow)} />
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
                <li key={p.id} className="flex items-start gap-2 py-2">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-3.5 w-3.5 accent-[var(--ink)]"
                    checked={!!accepted[p.id]}
                    onChange={(e) =>
                      setAccepted((cur) => ({
                        ...cur,
                        [p.id]: e.target.checked,
                      }))
                    }
                  />
                  <div className="flex-1">
                    <p
                      className="text-[13px] tracking-[-0.005em] text-[var(--ink)]"
                      style={{ fontFamily: "var(--serif)" }}
                    >
                      {p.label}
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
                      {p.op.kind === "appendGroup"
                        ? `New row · ${p.op.groupId}`
                        : `Set ${p.op.path.join(".")}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
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
