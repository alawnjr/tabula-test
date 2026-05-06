"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCaseStore } from "@/state/case-store";
import { useReviewStore } from "@/state/review-store";
import { buildPatches } from "@/lib/integrations/mapping";
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
  const setBundle = useReviewStore((s) => s.setBundle);
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
      <div className="space-y-6">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Imported data
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pull data into this case
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload a financial document or connect a bank. Bank pulls are
            saved here so you can re-import without signing into Teller again.
          </p>
        </header>
        <IntegrationsPanel caseId={caseId} />
      </div>
    );
  }

  const onReimport = () => {
    if (!record.bankData) return;
    const doc = record.bankData.doc;
    const patches = buildPatches(doc);
    setBundle(caseId, { doc, patches });
    router.push(`/case/${caseId}/review`);
  };

  const onClear = () => {
    if (!confirm("Discard all saved bank data? This cannot be undone.")) return;
    clearBankData(caseId);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Imported data
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Saved bank data
        </h1>
        <p className="text-sm text-muted-foreground">
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
          <RefreshCw className="h-4 w-4" /> Re-run import to forms
        </Button>
        <Button variant="ghost" onClick={onClear}>
          <Trash2 className="h-4 w-4" /> Discard saved data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
          <CardDescription>
            Aggregated across {totals.monthCount} month
            {totals.monthCount === 1 ? "" : "s"} of pulled history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Total inflow</p>
              <p className="font-medium">{formatCurrency(totals.inflow)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total outflow</p>
              <p className="font-medium">{formatCurrency(totals.outflow)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg monthly in</p>
              <p className="font-medium">
                {formatCurrency(totals.inflow / totals.monthCount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg monthly out</p>
              <p className="font-medium">
                {formatCurrency(totals.outflow / totals.monthCount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transactions</CardTitle>
            <Badge variant="secondary">{transactions.length}</Badge>
          </div>
          <CardDescription>
            Sorted newest first. Persisted locally to your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border text-sm">
            {transactions.slice(0, visible).map((t, i) => (
              <li
                key={`${t.accountId}-${t.date}-${i}`}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.date}
                    {t.accountLast4 ? ` · ***${t.accountLast4}` : ""}
                    {t.category ? ` · ${t.category}` : ""}
                    {t.status === "pending" ? " · pending" : ""}
                  </p>
                </div>
                <p
                  className={
                    t.amount >= 0
                      ? "flex items-center gap-1 font-medium text-emerald-600"
                      : "flex items-center gap-1 font-medium text-foreground"
                  }
                >
                  {t.amount >= 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  {formatCurrency(t.amount)}
                </p>
              </li>
            ))}
          </ul>
          {visible < transactions.length ? (
            <div className="mt-3 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, transactions.length - visible)} more
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
