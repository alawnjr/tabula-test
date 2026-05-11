"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  FileText,
  RefreshCw,
  Repeat,
  Search,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCaseStore } from "@/state/case-store";
import { useReviewStore } from "@/state/review-store";
import { buildPatches } from "@/lib/integrations/mapping";
import { aggregateTransactionsToItems } from "@/lib/integrations/tellerAggregate";
import type {
  BankTransaction,
  ExtractedDoc,
  ExtractedItem,
} from "@/lib/integrations/types";
import { IntegrationsPanel } from "@/components/case/IntegrationsPanel";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 40;
const MONTH_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatCurrencyPrecise(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatMonth(ym: string): string {
  // ym = "YYYY-MM"
  const [y, m] = ym.split("-");
  if (!y || !m) return ym;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return MONTH_FMT.format(d);
}

type SignFilter = "all" | "in" | "out";

type MonthRow = { month: string; inflow: number; outflow: number };

type Insights = {
  monthly: MonthRow[];
  monthCount: number;
  totalIn: number;
  totalOut: number;
  avgIn: number;
  avgOut: number;
  topCategories: { name: string; total: number }[];
  recurringIncome: {
    label: string;
    months: number;
    total: number;
    average: number;
  }[];
  netDelta: number;
};

function computeInsights(txs: BankTransaction[]): Insights {
  const byMonth = new Map<string, MonthRow>();
  const catTotals = new Map<string, number>();
  const incomeByKey = new Map<
    string,
    { sample: string; total: number; months: Set<string>; count: number }
  >();

  for (const t of txs) {
    const m = t.date.slice(0, 7);
    const row = byMonth.get(m) ?? { month: m, inflow: 0, outflow: 0 };
    if (t.amount >= 0) row.inflow += t.amount;
    else row.outflow += -t.amount;
    byMonth.set(m, row);

    if (t.amount < 0) {
      const cat = (t.category && t.category.trim()) || "Uncategorized";
      catTotals.set(cat, (catTotals.get(cat) ?? 0) + -t.amount);
    } else if (t.amount > 0) {
      const norm = t.description
        .toUpperCase()
        .replace(/\d+/g, "")
        .replace(/[^A-Z\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (norm.length === 0) continue;
      const cur = incomeByKey.get(norm) ?? {
        sample: t.description,
        total: 0,
        months: new Set<string>(),
        count: 0,
      };
      cur.total += t.amount;
      cur.months.add(m);
      cur.count += 1;
      incomeByKey.set(norm, cur);
    }
  }

  const monthly = Array.from(byMonth.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
  const monthCount = Math.max(1, monthly.length);
  const totalIn = monthly.reduce((s, r) => s + r.inflow, 0);
  const totalOut = monthly.reduce((s, r) => s + r.outflow, 0);

  const topCategories = Array.from(catTotals.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const recurringIncome = Array.from(incomeByKey.values())
    .filter((x) => x.months.size >= 2)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4)
    .map((x) => ({
      label: x.sample,
      months: x.months.size,
      total: x.total,
      average: x.total / x.months.size,
    }));

  return {
    monthly,
    monthCount,
    totalIn,
    totalOut,
    avgIn: totalIn / monthCount,
    avgOut: totalOut / monthCount,
    topCategories,
    recurringIncome,
    netDelta: totalIn - totalOut,
  };
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
  const reviewBundle = useReviewStore((s) => s.bundles[caseId]);
  const addDoc = useReviewStore((s) => s.addDoc);

  const [visible, setVisible] = useState(PAGE_SIZE);
  const [query, setQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [signFilter, setSignFilter] = useState<SignFilter>("all");

  const transactions = useMemo<BankTransaction[]>(
    () => record?.bankData?.doc.transactions ?? [],
    [record]
  );
  const txWindow = record?.bankData?.doc.transactionWindow;
  const sourceLabel = record?.bankData?.doc.sourceLabel;
  const savedAt = record?.bankData?.savedAt;

  const insights = useMemo(
    () => (transactions.length ? computeInsights(transactions) : null),
    [transactions]
  );

  const accounts = useMemo<{ key: string; label: string; balance?: number }[]>(
    () => {
      const bd = record?.bankData;
      if (!bd) return [];
      const items = (bd.doc.items ?? []).filter(
        (i): i is Extract<ExtractedItem, { kind: "depositAccount" }> =>
          i.kind === "depositAccount"
      );
      const fromItems = items.map((it) => ({
        key: it.lastFour ?? `${it.institution ?? "acct"}`,
        label: `${it.institution ?? "Account"}${
          it.lastFour ? ` ···${it.lastFour}` : ""
        }`,
        balance: it.balance,
      }));
      // Backfill any tx accounts that aren't in items
      const seen = new Set(fromItems.map((a) => a.key));
      const txOnly = new Map<string, string>();
      for (const t of transactions) {
        const k = t.accountLast4 ?? t.accountId;
        if (!seen.has(k) && !txOnly.has(k)) {
          txOnly.set(k, `Account ···${k}`);
        }
      }
      return [
        ...fromItems,
        ...Array.from(txOnly.entries()).map(([key, label]) => ({
          key,
          label,
        })),
      ];
    },
    [record, transactions]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (signFilter === "in" && t.amount < 0) return false;
      if (signFilter === "out" && t.amount >= 0) return false;
      if (accountFilter !== "all") {
        const k = t.accountLast4 ?? t.accountId;
        if (k !== accountFilter) return false;
      }
      if (q.length > 0) {
        const hay =
          (t.description ?? "") + " " + (t.category ?? "") + " " + t.date;
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transactions, query, accountFilter, signFilter]);

  const groupedByMonth = useMemo(() => {
    const out: { month: string; rows: BankTransaction[] }[] = [];
    const visibleSlice = filtered.slice(0, visible);
    let cur: { month: string; rows: BankTransaction[] } | null = null;
    for (const t of visibleSlice) {
      const m = t.date.slice(0, 7);
      if (!cur || cur.month !== m) {
        cur = { month: m, rows: [] };
        out.push(cur);
      }
      cur.rows.push(t);
    }
    return out;
  }, [filtered, visible]);

  // Combined sources feed: bank data (if any) + every uploaded doc still in
  // the review queue. De-duplicate by sourceLabel — bank pulls also live in
  // the review bundle, so we'd otherwise double-count.
  const sourcesFeed = useMemo(() => {
    const out: {
      label: string;
      kind: "upload" | "teller" | "manual";
      extractedAt: string;
      patches: number;
      summary?: string;
      transactions?: number;
    }[] = [];

    const reviewDocs = reviewBundle?.docs ?? [];
    const reviewPatches = reviewBundle?.patches ?? [];
    const bd = record?.bankData;

    if (bd?.doc) {
      const d = bd.doc;
      const pulledPatches = reviewPatches.filter(
        (p) => p.sourceLabel === d.sourceLabel
      ).length;
      out.push({
        label: d.sourceLabel,
        kind: "teller",
        extractedAt: bd.savedAt,
        patches: pulledPatches,
        summary: d.rawSummary,
        transactions: d.transactions?.length ?? 0,
      });
    }

    for (const d of reviewDocs) {
      // Skip the bank doc we already added
      if (d.source === "teller") continue;
      const count = reviewPatches.filter(
        (p) => p.sourceLabel === d.sourceLabel
      ).length;
      out.push({
        label: d.sourceLabel,
        kind: d.source,
        extractedAt: d.extractedAt,
        patches: count,
        summary: d.rawSummary,
      });
    }

    return out.sort((a, b) =>
      b.extractedAt.localeCompare(a.extractedAt)
    );
  }, [record, reviewBundle]);

  if (!record) return null;

  const pendingReviewCount = reviewBundle?.patches.length ?? 0;
  const hasIntakeYet = !!record.bankData || sourcesFeed.length > 0;

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

  const resetFilters = () => {
    setQuery("");
    setAccountFilter("all");
    setSignFilter("all");
    setVisible(PAGE_SIZE);
  };

  const filterActive =
    query.trim().length > 0 ||
    accountFilter !== "all" ||
    signFilter !== "all";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <span className="tag">Data intake</span>
          <h1
            className="text-[28px] leading-[1.05] tracking-[-0.025em] text-[var(--ink)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            {hasIntakeYet ? (
              <>
                What we know about{" "}
                <em className="text-[var(--mute)]">
                  {record.debtorName?.trim() || "this debtor"}.
                </em>
              </>
            ) : (
              <>
                Pull data into <em className="text-[var(--mute)]">this case.</em>
              </>
            )}
          </h1>
          {record.bankData ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] truncate">
              {sourceLabel}
              {txWindow ? ` · ${txWindow.fromISO} → ${txWindow.toISO}` : ""}
              {savedAt
                ? ` · saved ${new Date(savedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`
                : ""}
            </p>
          ) : (
            <p className="max-w-[60ch] text-[13px] leading-relaxed text-[var(--ink-2)]">
              Drop a financial document or connect a bank. Everything gets
              read, summarized, and queued for your review before it touches a
              schedule.
            </p>
          )}
        </div>
      </header>

      {pendingReviewCount > 0 ? (
        <Link
          href={`/case/${caseId}/review`}
          className="group flex items-center justify-between gap-3 rounded-[3px] border border-[var(--accent-deep)] bg-[color-mix(in_oklch,var(--accent)_10%,var(--paper-2))] px-4 py-2.5 transition-colors hover:bg-[color-mix(in_oklch,var(--accent)_18%,var(--paper-2))]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--accent-deep)]" />
            <div className="min-w-0">
              <p
                className="text-[13.5px] tracking-[-0.005em] text-[var(--ink)] truncate"
                style={{ fontFamily: "var(--serif)" }}
              >
                {pendingReviewCount}{" "}
                {pendingReviewCount === 1 ? "entry" : "entries"} waiting for
                your review
              </p>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--mute)]">
                Approve or edit before they land on the schedules
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--accent-deep)] flex items-center gap-1 shrink-0">
            Open queue
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ) : null}

      <IntegrationsPanel caseId={caseId} />

      {insights ? (
        <>
          <SnapshotRow
            insights={insights}
            accountCount={accounts.length}
            transactionCount={transactions.length}
          />
          <InsightsRow insights={insights} />
        </>
      ) : null}

      {sourcesFeed.length > 0 ? (
        <SourcesFeed caseId={caseId} sources={sourcesFeed} />
      ) : null}

      {accounts.length > 0 ? <AccountsList accounts={accounts} /> : null}

      {transactions.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 border-b border-[var(--rule)] pb-2">
            <span className="tag">Transactions</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
              {filtered.length === transactions.length
                ? `${transactions.length} on file`
                : `${filtered.length} of ${transactions.length}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--mute)]" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                placeholder="Search description, category, date…"
                className="pl-7"
              />
            </div>

            <div
              className="inline-flex overflow-hidden rounded-[3px] border border-[var(--rule)] text-[10px]"
              role="radiogroup"
              aria-label="Direction"
            >
              {(
                [
                  { id: "all", label: "All" },
                  { id: "in", label: "Inflow" },
                  { id: "out", label: "Outflow" },
                ] as { id: SignFilter; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={signFilter === opt.id}
                  onClick={() => {
                    setSignFilter(opt.id);
                    setVisible(PAGE_SIZE);
                  }}
                  className={cn(
                    "px-2.5 py-1 font-mono uppercase tracking-[0.08em] transition-colors",
                    signFilter === opt.id
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "bg-[var(--paper)] text-[var(--mute)] hover:bg-[var(--paper-3)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {accounts.length > 1 ? (
              <select
                value={accountFilter}
                onChange={(e) => {
                  setAccountFilter(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                className="h-[26px] rounded-[3px] border border-[var(--rule)] bg-[var(--paper)] px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-2)] hover:bg-[var(--paper-3)] focus:outline-none focus:border-[var(--ink)]"
              >
                <option value="all">All accounts</option>
                {accounts.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </select>
            ) : null}

            {filterActive ? (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Reset
              </Button>
            ) : null}
          </div>

          {groupedByMonth.length === 0 ? (
            <p className="border border-dashed border-[var(--rule)] bg-[var(--paper-2)] px-4 py-6 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] rounded-[3px]">
              No transactions match these filters
            </p>
          ) : (
            <div className="space-y-4">
              {groupedByMonth.map((g) => {
                const monthIn = g.rows.reduce(
                  (s, t) => s + Math.max(0, t.amount),
                  0
                );
                const monthOut = g.rows.reduce(
                  (s, t) => s + (t.amount < 0 ? -t.amount : 0),
                  0
                );
                return (
                  <div key={g.month} className="space-y-1">
                    <div className="sticky top-[var(--case-header-h)] z-10 -mx-4 flex items-baseline justify-between gap-3 border-b border-[var(--rule-soft)] bg-[color-mix(in_oklch,var(--paper)_92%,transparent)] px-4 py-1 backdrop-blur lg:-mx-8 lg:px-8">
                      <span
                        className="text-[12px] tracking-[-0.005em] text-[var(--ink-2)]"
                        style={{ fontFamily: "var(--serif)" }}
                      >
                        {formatMonth(g.month)}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)] tabular-nums">
                        +{formatCurrency(monthIn)} · −{formatCurrency(monthOut)}
                      </span>
                    </div>
                    <ul className="divide-y divide-[var(--rule-soft)]">
                      {g.rows.map((t, i) => (
                        <TxRow key={`${t.accountId}-${t.date}-${i}`} t={t} />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {visible < filtered.length ? (
            <div className="flex justify-center pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {record.bankData ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--rule-soft)] pt-4">
          <Button onClick={onReimport}>
            <RefreshCw className="h-3 w-3" /> Re-run import to forms
          </Button>
          <Button variant="ghost" onClick={onClear}>
            <Trash2 className="h-3 w-3" /> Discard saved data
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// ---------- Subcomponents ----------

function SnapshotRow({
  insights,
  accountCount,
  transactionCount,
}: {
  insights: Insights;
  accountCount: number;
  transactionCount: number;
}) {
  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-[var(--rule)] bg-[var(--rule-soft)] sm:grid-cols-4">
      <Stat
        label="Accounts"
        value={accountCount > 0 ? String(accountCount) : "—"}
        sub={`${transactionCount} tx`}
      />
      <Stat
        label="History"
        value={`${insights.monthCount} mo`}
        sub={
          insights.monthly.length > 0
            ? `${formatMonth(insights.monthly[0].month)} → ${formatMonth(
                insights.monthly[insights.monthly.length - 1].month
              )}`
            : undefined
        }
      />
      <Stat
        label="Avg monthly in"
        value={formatCurrency(insights.avgIn)}
        accent="up"
      />
      <Stat
        label="Avg monthly out"
        value={formatCurrency(insights.avgOut)}
        accent="down"
      />
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "up" | "down";
}) {
  return (
    <div className="bg-[var(--paper-2)] px-4 py-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)] flex items-center gap-1.5">
        {accent === "up" ? <TrendingUp className="h-3 w-3" /> : null}
        {accent === "down" ? <TrendingDown className="h-3 w-3" /> : null}
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-[20px] leading-tight tracking-[-0.018em] tabular-nums",
          accent === "up"
            ? "text-[var(--accent-deep)]"
            : "text-[var(--ink)]"
        )}
        style={{ fontFamily: "var(--serif)" }}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)] truncate">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function InsightsRow({ insights }: { insights: Insights }) {
  return (
    <section className="grid gap-3 lg:grid-cols-3">
      <CashFlowCard insights={insights} />
      <TopCategoriesCard insights={insights} />
      <RecurringIncomeCard insights={insights} />
    </section>
  );
}

function CashFlowCard({ insights }: { insights: Insights }) {
  const monthly = insights.monthly;
  const max = Math.max(
    1,
    ...monthly.map((m) => Math.max(m.inflow, m.outflow))
  );

  // Sparkline: net (inflow - outflow) per month
  const W = 240;
  const H = 56;
  const padX = 4;
  const padY = 6;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const points = monthly.map((m, i) => {
    const x =
      monthly.length === 1
        ? padX + innerW / 2
        : padX + (i / (monthly.length - 1)) * innerW;
    const net = m.inflow - m.outflow;
    const norm = (net + max) / (2 * max); // 0..1
    const y = padY + (1 - norm) * innerH;
    return { x, y, net };
  });
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${path} L${points[points.length - 1].x.toFixed(1)},${(H - padY).toFixed(
          1
        )} L${points[0].x.toFixed(1)},${(H - padY).toFixed(1)} Z`
      : "";

  return (
    <div className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)] p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
        Cash flow trend
      </p>
      <p
        className={cn(
          "mt-0.5 text-[18px] tracking-[-0.018em] tabular-nums",
          insights.netDelta >= 0
            ? "text-[var(--accent-deep)]"
            : "text-[var(--destructive)]"
        )}
        style={{ fontFamily: "var(--serif)" }}
      >
        {insights.netDelta >= 0 ? "+" : "−"}
        {formatCurrency(Math.abs(insights.netDelta))}
        <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
          net · {insights.monthCount}mo
        </span>
      </p>
      {monthly.length === 0 ? (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)]">
          No history
        </p>
      ) : (
        <svg
          className="mt-2 w-full"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <line
            x1={padX}
            x2={W - padX}
            y1={H / 2}
            y2={H / 2}
            stroke="var(--rule-soft)"
            strokeDasharray="2 3"
          />
          {areaPath ? (
            <path
              d={areaPath}
              fill="color-mix(in oklch, var(--accent) 14%, transparent)"
            />
          ) : null}
          <path
            d={path}
            fill="none"
            stroke="var(--accent-deep)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={1.6}
              fill="var(--accent-deep)"
            />
          ))}
        </svg>
      )}
      <div className="mt-1 flex justify-between font-mono text-[8.5px] uppercase tracking-[0.1em] text-[var(--mute)]">
        <span>{monthly.length > 0 ? formatMonth(monthly[0].month) : ""}</span>
        <span>
          {monthly.length > 0
            ? formatMonth(monthly[monthly.length - 1].month)
            : ""}
        </span>
      </div>
    </div>
  );
}

function TopCategoriesCard({ insights }: { insights: Insights }) {
  const max = Math.max(1, ...insights.topCategories.map((c) => c.total));
  return (
    <div className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)] p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)] flex items-center gap-1.5">
        <TrendingDown className="h-3 w-3" />
        Top expense categories
      </p>
      {insights.topCategories.length === 0 ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)]">
          No outflows on file
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {insights.topCategories.map((c) => (
            <li key={c.name} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span
                  className="truncate text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  {c.name}
                </span>
                <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-[var(--ink-2)]">
                  {formatCurrency(c.total)}
                </span>
              </div>
              <div className="h-[3px] w-full bg-[var(--paper-3)] overflow-hidden rounded-full">
                <div
                  className="h-full bg-[var(--accent-deep)]"
                  style={{ width: `${Math.max(2, (c.total / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecurringIncomeCard({ insights }: { insights: Insights }) {
  return (
    <div className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)] p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)] flex items-center gap-1.5">
        <Repeat className="h-3 w-3" />
        Recurring income
      </p>
      {insights.recurringIncome.length === 0 ? (
        <p className="mt-2 text-[12px] text-[var(--mute)]">
          Nothing detected across multiple months yet — keep importing or
          connect a longer history.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {insights.recurringIncome.map((r, i) => (
            <li key={i} className="space-y-0.5">
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span
                  className="truncate text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                  title={r.label}
                >
                  {r.label}
                </span>
                <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-[var(--accent-deep)]">
                  +{formatCurrency(r.average)}/mo
                </span>
              </div>
              <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-[var(--mute)]">
                {r.months} months · {formatCurrencyPrecise(r.total)} total
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AccountsList({
  accounts,
}: {
  accounts: { key: string; label: string; balance?: number }[];
}) {
  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const hasAnyBalance = accounts.some((a) => typeof a.balance === "number");
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between border-b border-[var(--rule)] pb-2">
        <span className="tag">Accounts</span>
        {hasAnyBalance ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] tabular-nums">
            Total {formatCurrencyPrecise(totalBalance)}
          </span>
        ) : null}
      </div>
      <ul className="divide-y divide-[var(--rule-soft)] rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)] px-4">
        {accounts.map((a) => (
          <li
            key={a.key}
            className="flex items-baseline justify-between gap-3 py-2 text-[13px]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-[var(--ink-2)] shrink-0" />
              <span
                className="truncate tracking-[-0.005em] text-[var(--ink)]"
                style={{ fontFamily: "var(--serif)" }}
              >
                {a.label}
              </span>
            </span>
            <span className="shrink-0 font-medium tabular-nums text-[var(--ink)]">
              {typeof a.balance === "number"
                ? formatCurrencyPrecise(a.balance)
                : "—"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SourcesFeed({
  caseId,
  sources,
}: {
  caseId: string;
  sources: {
    label: string;
    kind: "upload" | "teller" | "manual";
    extractedAt: string;
    patches: number;
    summary?: string;
    transactions?: number;
  }[];
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between border-b border-[var(--rule)] pb-2">
        <span className="tag">Sources</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          {sources.length} {sources.length === 1 ? "source" : "sources"}
        </span>
      </div>
      <ul className="divide-y divide-[var(--rule-soft)] rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)] px-4">
        {sources.map((s) => (
          <li
            key={s.label + s.extractedAt}
            className="flex items-start justify-between gap-3 py-2.5"
          >
            <span className="flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] border border-[var(--rule)] bg-[var(--paper)]">
                {s.kind === "teller" ? (
                  <Wallet className="h-3.5 w-3.5 text-[var(--ink-2)]" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-[var(--ink-2)]" />
                )}
              </span>
              <span className="min-w-0">
                <span
                  className="block truncate text-[13px] tracking-[-0.005em] text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  {s.label}
                </span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
                  {s.kind === "teller" ? "Bank pull" : "Document"}
                  {" · "}
                  {new Date(s.extractedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {s.transactions
                    ? ` · ${s.transactions} tx`
                    : ""}
                </span>
                {s.summary ? (
                  <span
                    className="mt-1 block max-w-[60ch] text-[12px] italic text-[var(--ink-2)] line-clamp-2"
                    style={{ fontFamily: "var(--serif)" }}
                  >
                    {s.summary}
                  </span>
                ) : null}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {s.patches > 0 ? (
                <Badge variant="accent">
                  {s.patches} pending
                </Badge>
              ) : (
                <Badge variant="outline">applied</Badge>
              )}
              {s.patches > 0 ? (
                <Link
                  href={`/case/${caseId}/review`}
                  className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-2)] hover:text-[var(--ink)]"
                >
                  Review →
                </Link>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TxRow({ t }: { t: BankTransaction }) {
  const isInflow = t.amount >= 0;
  return (
    <li className="grid grid-cols-12 items-baseline gap-2 py-1.5 text-[12.5px]">
      <span className="col-span-2 font-mono text-[10px] tracking-[0.04em] text-[var(--mute)] tabular-nums">
        {t.date.slice(5)}
      </span>
      <span className="col-span-7 min-w-0">
        <span
          className="block truncate text-[13px] tracking-[-0.005em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          {t.description}
        </span>
        <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)] truncate">
          {t.accountLast4 ? `***${t.accountLast4}` : "—"}
          {t.category ? ` · ${t.category}` : ""}
          {t.status === "pending" ? " · pending" : ""}
        </span>
      </span>
      <span
        className={cn(
          "col-span-3 inline-flex items-center justify-end gap-1 font-medium tabular-nums",
          isInflow ? "text-[var(--accent-deep)]" : "text-[var(--ink)]"
        )}
      >
        {isInflow ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
        {formatCurrencyPrecise(t.amount)}
      </span>
    </li>
  );
}
