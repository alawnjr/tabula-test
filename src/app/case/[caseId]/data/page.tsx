"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCaseStore } from "@/state/case-store";
import { useReviewStore } from "@/state/review-store";
import { buildPatches } from "@/lib/integrations/mapping";
import { aggregateTransactionsToItems } from "@/lib/integrations/tellerAggregate";
import type { ExtractedDoc } from "@/lib/integrations/types";
import { IntegrationsPanel } from "@/components/case/IntegrationsPanel";

const PAGE_SIZE = 50;

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default function CaseDataPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const router = useRouter();
  const record = useCaseStore((s) => s.cases[caseId]);
  const clearBankData = useCaseStore((s) => s.clearBankData);
  const addDoc = useReviewStore((s) => s.addDoc);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const transactions = record?.bankData?.doc.transactions ?? [];
  const txWindow = record?.bankData?.doc.transactionWindow;
  const sourceLabel = record?.bankData?.doc.sourceLabel;
  const savedAt = record?.bankData?.savedAt;

  const totals = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    const months = new Set<string>();
    for (const t of transactions) {
      if (t.amount >= 0) inflow += t.amount;
      else outflow += -t.amount;
      months.add(t.date.slice(0, 7));
    }
    return { inflow, outflow, monthCount: Math.max(1, months.size) };
  }, [transactions]);

  if (!record) return null;

  if (transactions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8 space-y-6">
        <header className="space-y-2">
          <span className="tag">Data room</span>
          <h1
            className="text-[28px] leading-[1.05] tracking-[-0.025em] text-[var(--ink)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            Pull data into <em className="text-[var(--mute)]">this case.</em>
          </h1>
          <p className="max-w-[60ch] text-[13px] leading-relaxed text-[var(--ink-2)]">
            Upload a financial document or connect a bank. Bank pulls are
            saved here so you can re-import without signing into Teller again.
          </p>
        </header>
        <IntegrationsPanel caseId={caseId} />
      </div>
    );
  }

  const onReimport = () => {
    const fresh = useCaseStore.getState().cases[caseId]?.bankData?.doc;
    if (!fresh) return;
    const accountItems = (fresh.items ?? []).filter(
      (i) => i.kind !== "monthlyScalar" && i.kind !== "monthlyOtherIncome"
    );
    const aggregates = aggregateTransactionsToItems(fresh.transactions ?? []);
    const doc: ExtractedDoc = {
      ...fresh,
      items: [...accountItems, ...aggregates],
    };
    const patches = buildPatches(doc);
    if (patches.length === 0) {
      alert(
        "No patches generated. The saved data may be missing accounts and transactions — re-run the bank pull from the connect button above."
      );
      return;
    }
    addDoc(caseId, { doc, patches });
    router.push(`/case/${caseId}/review`);
  };

  const onClear = () => {
    if (!confirm("Discard all saved bank data? This cannot be undone.")) return;
    clearBankData(caseId);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8 space-y-6">
      <header className="space-y-2">
        <span className="tag">Data room</span>
        <h1
          className="text-[28px] leading-[1.05] tracking-[-0.025em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          Saved bank data
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          {sourceLabel}
          {txWindow ? ` · ${txWindow.fromISO} → ${txWindow.toISO}` : ""}
          {savedAt
            ? ` · saved ${new Date(savedAt).toLocaleString()}`
            : ""}
        </p>
      </header>

      <IntegrationsPanel caseId={caseId} />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onReimport}>
          <RefreshCw className="h-3 w-3" /> Re-run import to forms
        </Button>
        <Button variant="ghost" onClick={onClear}>
          <Trash2 className="h-3 w-3" /> Discard saved data
        </Button>
      </div>

      <section className="space-y-2">
        <div className="flex items-end justify-between border-b border-[var(--rule)] pb-2">
          <span className="tag">Summary</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
            {totals.monthCount} {totals.monthCount === 1 ? "month" : "months"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
          <Stat label="Total inflow" value={formatCurrency(totals.inflow)} />
          <Stat label="Total outflow" value={formatCurrency(totals.outflow)} />
          <Stat
            label="Avg monthly in"
            value={formatCurrency(totals.inflow / totals.monthCount)}
          />
          <Stat
            label="Avg monthly out"
            value={formatCurrency(totals.outflow / totals.monthCount)}
          />
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-end justify-between border-b border-[var(--rule)] pb-2">
          <span className="tag">Transactions</span>
          <Badge variant="outline">{transactions.length} on file</Badge>
        </div>

        <ul className="divide-y divide-[var(--rule-soft)]">
          {transactions.slice(0, visible).map((t, i) => (
            <li
              key={`${t.accountId}-${t.date}-${i}`}
              className="grid grid-cols-12 items-baseline gap-2 py-2 text-[12.5px]"
            >
              <span className="col-span-2 font-mono text-[10px] tracking-[0.04em] text-[var(--mute)] tabular-nums">
                {t.date}
              </span>
              <span className="col-span-7 min-w-0">
                <span
                  className="block truncate text-[13px] tracking-[-0.005em] text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  {t.description}
                </span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
                  {t.accountLast4 ? `***${t.accountLast4}` : "—"}
                  {t.category ? ` · ${t.category}` : ""}
                  {t.status === "pending" ? " · pending" : ""}
                </span>
              </span>
              <span
                className={
                  "col-span-3 inline-flex items-center justify-end gap-1 font-medium tabular-nums " +
                  (t.amount >= 0
                    ? "text-[var(--accent-deep)]"
                    : "text-[var(--ink)]")
                }
              >
                {t.amount >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {formatCurrency(t.amount)}
              </span>
            </li>
          ))}
        </ul>

        {visible < transactions.length ? (
          <div className="flex justify-center pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
            >
              Show {Math.min(PAGE_SIZE, transactions.length - visible)} more
            </Button>
          </div>
        ) : null}
      </section>
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
        className="mt-0.5 text-[18px] tracking-[-0.015em] text-[var(--ink)] tabular-nums"
        style={{ fontFamily: "var(--serif)" }}
      >
        {value}
      </p>
    </div>
  );
}
