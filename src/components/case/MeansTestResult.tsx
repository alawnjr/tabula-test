"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCaseStore } from "@/state/case-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { computeMeansTest } from "@/lib/meansTest";
import { formatCurrency } from "@/lib/currency";

const TONE_BY_VERDICT = {
  "below-median": "good",
  "safe-harbor": "good",
  "no-presumption": "warn",
  uncertain: "warn",
  "presumption-of-abuse": "bad",
  incomplete: "warn",
} as const;

export function MeansTestResult({ caseId }: { caseId: string }) {
  const record = useCaseStore((s) => s.cases[caseId]);
  const branch = useCaseStore((s) => s.branchToChapter);
  const router = useRouter();

  if (!record) return null;
  const result = computeMeansTest(record);
  const tone = TONE_BY_VERDICT[result.verdict];
  const incomplete = result.verdict === "incomplete";

  const onStartChapter = (chapter: "chapter7" | "chapter13") => {
    const newId = branch(caseId, chapter);
    if (!newId) return;
    router.push(`/case/${newId}`);
  };

  return (
    <div className="space-y-8">
      <Verdict
        label={result.verdictLabel}
        detail={result.verdictDetail}
        tone={tone}
      />

      {result.missing.length > 0 ? (
        <MissingPanel
          incomplete={incomplete}
          items={result.missing}
          a1Href={`/case/${record.id}/122A-1`}
          a2Href={`/case/${record.id}/122A-2`}
          dataHref={`/case/${record.id}/data`}
        />
      ) : null}

      <section className="grid gap-3 md:grid-cols-2">
        <Panel tag="Form 122A-1" title="Current monthly income">
          <Row
            label="Monthly (CMI)"
            value={formatCurrency(result.cmiMonthly)}
            emphasis
          />
          <Row
            label="Annualized"
            value={formatCurrency(result.cmiAnnual)}
          />
          <Row
            label={`State median${
              result.state ? ` · ${result.state}` : ""
            } · ${result.householdSize} in household`}
            value={formatCurrency(result.medianAnnual)}
          />
          <Row
            label="Position vs. median"
            value={
              result.belowMedian
                ? "At or below median"
                : `Above median by ${formatCurrency(
                    result.cmiAnnual - result.medianAnnual
                  )}`
            }
            emphasis
          />
        </Panel>

        <Panel
          tag="Form 122A-2"
          title="Means-test calculation"
          muted={result.belowMedian}
        >
          {result.belowMedian ? (
            <p
              className="text-[12.5px] italic text-[var(--ink-2)]"
              style={{ fontFamily: "var(--serif)" }}
            >
              Not required — income is at or below the state median.
            </p>
          ) : (
            <>
              <Row
                label="Total allowed deductions"
                value={formatCurrency(result.totalDeductions)}
              />
              <Row
                label="Monthly disposable income"
                value={formatCurrency(result.monthlyDisposable)}
                emphasis
              />
              <Row
                label="60-month projection"
                value={formatCurrency(result.disposable60)}
              />
            </>
          )}
        </Panel>
      </section>

      <section className="space-y-3">
        <header className="flex items-end justify-between border-b border-[var(--rule)] pb-2">
          <span className="tag">Continue filing</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
            Forms carry over
          </span>
        </header>
        <p className="max-w-[60ch] text-[12.5px] text-[var(--ink-2)]">
          {incomplete
            ? "Branching is disabled until there's enough data to compute a verdict. Fill in the items above, then come back."
            : "Starting a chapter from here creates a new case in your docket with the 122A-1 and 122A-2 entries, plus any uploaded documents and bank data, already in place."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => onStartChapter("chapter7")}
            disabled={incomplete}
          >
            Start Chapter 7 with this data
          </Button>
          <Button
            variant="outline"
            onClick={() => onStartChapter("chapter13")}
            disabled={incomplete}
          >
            Start Chapter 13 with this data
          </Button>
        </div>
      </section>
    </div>
  );
}

function MissingPanel({
  incomplete,
  items,
  a1Href,
  a2Href,
  dataHref,
}: {
  incomplete: boolean;
  items: string[];
  a1Href: string;
  a2Href: string;
  dataHref: string;
}) {
  return (
    <section className="rounded-[3px] border border-dashed border-[var(--rule)] bg-[var(--paper)] px-4 py-4 space-y-3">
      <header className="space-y-0.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Still needed
        </span>
        <h3
          className="text-[15px] tracking-[-0.015em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          {incomplete
            ? "Tabula needs more data before it can run the means test."
            : "A few more entries will sharpen the verdict."}
        </h3>
      </header>
      <ul className="space-y-1.5 text-[12.5px] leading-snug text-[var(--ink-2)]">
        {items.map((m, i) => (
          <li key={i} className="flex gap-2">
            <span className="select-none text-[var(--mute)]">·</span>
            <span>{m}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button asChild size="sm" variant="outline">
          <Link href={a1Href}>Open 122A-1</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href={a2Href}>Open 122A-2</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href={dataHref}>Upload pay stub or bank pull</Link>
        </Button>
      </div>
    </section>
  );
}

function Verdict({
  label,
  detail,
  tone,
}: {
  label: string;
  detail: string;
  tone: "good" | "warn" | "bad";
}) {
  const badge = tone === "good" ? "deep" : tone === "bad" ? "ink" : "outline";
  const eyebrow =
    tone === "good"
      ? "Likely eligible"
      : tone === "bad"
      ? "Likely ineligible"
      : "Review needed";
  return (
    <section className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)]">
      <header className="flex items-center justify-between border-b border-[var(--rule-soft)] px-4 py-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Eligibility · Chapter 7
        </span>
        <Badge variant={badge}>{eyebrow}</Badge>
      </header>
      <div className="space-y-2 px-4 py-4">
        <h2
          className="text-[24px] tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          {label}
        </h2>
        <p className="max-w-[68ch] text-[13px] leading-relaxed text-[var(--ink-2)]">
          {detail}
        </p>
      </div>
    </section>
  );
}

function Panel({
  tag,
  title,
  muted,
  children,
}: {
  tag: string;
  title: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        "rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)] " +
        (muted ? "opacity-70" : "")
      }
    >
      <header className="space-y-1 border-b border-[var(--rule-soft)] px-4 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          {tag}
        </span>
        <h3
          className="text-[15px] tracking-[-0.015em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          {title}
        </h3>
      </header>
      <div className="px-4 py-2 space-y-1">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        "flex items-baseline justify-between py-1 text-[12.5px] " +
        (emphasis
          ? "border-t border-[var(--rule)] mt-1 pt-2 font-medium text-[var(--ink)]"
          : "text-[var(--ink-2)]")
      }
    >
      <span className={emphasis ? "" : "text-[var(--mute)]"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
