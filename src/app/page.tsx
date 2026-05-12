"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCaseStore } from "@/state/case-store";
import { chapterLabel } from "@/lib/schemas";
import { ImportExport } from "@/components/case/ImportExport";
import { ConvexStoreSync } from "@/components/ConvexStoreSync";
import { caseSummary } from "@/lib/derived";
import { computeMeansTest } from "@/lib/meansTest";
import { formatCurrency } from "@/lib/currency";
import type { ChapterId } from "@/lib/schemas/types";
import type { CaseRecord } from "@/state/case-store";

export default function Home() {
  const isLoaded = useCaseStore((s) => s.isLoaded);
  const loadCase = useCaseStore((s) => s.loadCase);
  const cases = useCaseStore((s) => s.cases);
  const router = useRouter();
  const convexCreate = useMutation(api.cases.create);

  const onNew = async (chapter: ChapterId) => {
    const firstForm = chapter === "meansTest" ? "122A-1" : "101";
    const now = new Date().toISOString();
    const forms: Record<string, Record<string, unknown>> =
      chapter === "meansTest" ? {} : { "101": { chapterChoice: chapter } };
    try {
      const id = await convexCreate({
        chapter,
        debtorName: "",
        createdAt: now,
        updatedAt: now,
        data: { forms },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loadCase({ id, chapter, debtorName: "", createdAt: now, updatedAt: now, forms: forms as any });
      router.push(`/case/${id}/${firstForm}`);
    } catch (err) {
      console.error("Failed to create case:", err);
      alert(`Could not create case: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const list = Object.values(cases).sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : -1
  );

  return (
    <>
      <ConvexStoreSync />
      <header
        className="sticky top-0 z-30 border-b border-[var(--rule-soft)] bg-[var(--paper)]"
        style={{ height: "var(--case-header-h)" }}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">
          <Link href="/" className="logo">
            Case Builder<span className="logo-dot" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="pill">
              <span className="dot pulse" />
              Chapter 7 & 13
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10">
        <section className="space-y-6">
          <span className="pill">
            <span className="dot pulse" />
            Bankruptcy workspace
          </span>
          <h1 className="display max-w-[14ch] text-[clamp(48px,7vw,96px)] text-[var(--ink)]">
            Case files,
            <br />
            <em>handled.</em>
          </h1>
          <p className="max-w-[52ch] text-[15px] font-light leading-relaxed text-[var(--ink-2)]">
            A schedule-by-schedule workspace for Chapter 7 and Chapter 13
            filings. Pull bank data, extract documents, and assemble a
            complete petition without leaving the brief.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button onClick={() => onNew("chapter7")}>New Chapter 7</Button>
            <Button variant="outline" onClick={() => onNew("chapter13")}>
              New Chapter 13
            </Button>
            <Button variant="outline" onClick={() => onNew("meansTest")}>
              Means test
            </Button>
            <span
              className="ml-1 h-3.5 w-px bg-[var(--rule)]"
              aria-hidden
            />
            <ImportExport />
          </div>
          <p className="max-w-[52ch] text-[12px] text-[var(--mute)]">
            Not sure which chapter? Run the <em>means test</em> first — Tabula
            tells you whether you qualify for Chapter 7, then carries your
            entries forward into a full filing.
          </p>
        </section>

        <section className="mt-16 space-y-4">
          <div className="flex items-end justify-between gap-6 border-b border-[var(--rule)] pb-2.5">
            <div className="space-y-1">
              <span className="tag">Docket</span>
              <h2
                className="text-[22px] tracking-[-0.02em]"
                style={{ fontFamily: "var(--serif)" }}
              >
                Your cases
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)]">
              {isLoaded ? `${list.length} on file` : "Loading…"}
            </span>
          </div>

          {!isLoaded ? (
            <p className="text-[12.5px] text-[var(--mute)]">Loading…</p>
          ) : list.length === 0 ? (
            <div className="rounded-[3px] border border-dashed border-[var(--rule)] bg-[var(--paper-2)] px-5 py-9 text-center">
              <p
                className="text-[16px] tracking-[-0.01em] text-[var(--ink-2)]"
                style={{ fontFamily: "var(--serif)" }}
              >
                <em>No cases yet.</em>
              </p>
              <p className="mt-1.5 text-[12px] text-[var(--mute)]">
                Create a Chapter 7 or 13 above to begin.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--rule-soft)] border-y border-[var(--rule-soft)]">
              {list.map((c, i) => {
                const idShort = c.id.slice(-6).toUpperCase();
                return (
                  <li key={c.id}>
                    <Link
                      href={`/case/${c.id}`}
                      className="group grid grid-cols-12 items-center gap-5 px-1 py-4 transition-colors hover:bg-[var(--paper-2)]"
                    >
                      <div className="col-span-1 hidden md:block">
                        <span className="font-mono text-[10px] tracking-[0.12em] text-[var(--mute)]">
                          № {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="col-span-12 md:col-span-5">
                        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                          Case {idShort}
                        </p>
                        <p
                          className="mt-0.5 text-[18px] leading-tight tracking-[-0.015em] text-[var(--ink)] group-hover:text-[var(--accent-deep)]"
                          style={{ fontFamily: "var(--serif)" }}
                        >
                          {c.debtorName || (
                            <em className="text-[var(--mute)]">
                              {c.chapter === "meansTest"
                                ? "Means-test draft"
                                : "Untitled debtor"}
                            </em>
                          )}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {chapterLabel(c.chapter)}
                          </Badge>
                          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                            Updated{" "}
                            {new Date(c.updatedAt).toLocaleDateString(
                              undefined,
                              { dateStyle: "medium" }
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-12 grid grid-cols-3 gap-3 md:col-span-6">
                        <CaseStats record={c} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function CaseStats({ record }: { record: CaseRecord }) {
  if (record.chapter === "meansTest") {
    const r = computeMeansTest(record);
    return (
      <>
        <Stat label="Monthly income" value={formatCurrency(r.cmiMonthly)} />
        <Stat
          label="State median"
          value={formatCurrency(r.medianAnnual / 12)}
        />
        <Stat
          label="Status"
          value={r.verdictLabel}
          accent={
            r.verdict === "below-median" || r.verdict === "safe-harbor"
          }
        />
      </>
    );
  }
  const s = caseSummary(record);
  return (
    <>
      <Stat label="Assets" value={formatCurrency(s.assets.grand)} />
      <Stat label="Liabilities" value={formatCurrency(s.liabilities.grand)} />
      <Stat
        label="Monthly net"
        value={formatCurrency(s.net)}
        accent={s.net >= 0}
      />
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
        {label}
      </p>
      <p
        className={
          "mt-0.5 text-[15px] tracking-[-0.01em] tabular-nums " +
          (accent ? "text-[var(--accent-deep)]" : "text-[var(--ink)]")
        }
        style={{ fontFamily: "var(--serif)" }}
      >
        {value}
      </p>
    </div>
  );
}
