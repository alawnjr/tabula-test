"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { useCaseStore, type CaseRecord } from "@/state/case-store";
import { chapterLabel } from "@/lib/schemas";
import { ImportExport } from "@/components/case/ImportExport";
import { ConvexStoreSync } from "@/components/ConvexStoreSync";
import { caseSummary, piStats } from "@/lib/derived";
import { computeMeansTest } from "@/lib/meansTest";
import { formatCurrency } from "@/lib/currency";
import type { ChapterId } from "@/lib/schemas/types";

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  "motor-vehicle": "Motor vehicle",
  "slip-fall": "Slip & fall",
  "dog-bite": "Dog bite",
  "medical-malpractice": "Med. malpractice",
  "product-liability": "Product liability",
  "premises-liability": "Premises liability",
  "other": "Other",
};

export type CreateOption = {
  label: string;
  chapter: ChapterId;
  variant?: "default" | "outline";
};

type Props = {
  chapters: ChapterId[];
  createOptions: CreateOption[];
  heroTitle: React.ReactNode;
  heroDesc: string;
  badgeLabel: string;
  backHref?: string;
  extraActions?: React.ReactNode;
};

export function PracticeAreaDashboard({
  chapters,
  createOptions,
  heroTitle,
  heroDesc,
  badgeLabel,
  backHref,
  extraActions,
}: Props) {
  const { isSignedIn } = useUser();
  const isLoaded = useCaseStore((s) => s.isLoaded);
  const loadCase = useCaseStore((s) => s.loadCase);
  const allCases = useCaseStore((s) => s.cases);
  const deleteCase = useCaseStore((s) => s.deleteCase);
  const router = useRouter();
  const convexCreate = useMutation(api.cases.create);
  const convexUpdate = useMutation(api.cases.update);
  const convexRemove = useMutation(api.cases.remove);

  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const chapterSet = new Set(chapters);
  const list = Object.values(allCases)
    .filter((c) => chapterSet.has(c.chapter))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const onNew = async (chapter: ChapterId) => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    const firstForm =
      chapter === "meansTest"
        ? "122A-1"
        : chapter === "personalInjury"
        ? "pi-intake"
        : "101";
    const now = new Date().toISOString();
    const forms: Record<string, Record<string, unknown>> =
      chapter === "meansTest" ? {} : chapter === "chapter7" || chapter === "chapter13"
        ? { "101": { chapterChoice: chapter } }
        : {};
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

  const startRename = (caseId: string, currentName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRenaming(caseId);
    setRenameVal(currentName);
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const commitRename = async (caseId: string) => {
    if (!renaming) return;
    setRenaming(null);
    const trimmed = renameVal.trim();
    try {
      await convexUpdate({ id: caseId as Id<"cases">, debtorName: trimmed });
      loadCase({ ...allCases[caseId], debtorName: trimmed });
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const onDelete = async (caseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this case? This cannot be undone.")) return;
    try {
      await convexRemove({ id: caseId as Id<"cases"> });
      deleteCase(caseId);
    } catch (err) {
      console.error("Delete failed:", err);
      alert(`Could not delete case: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const untitledLabel =
    chapters.includes("chapter7") || chapters.includes("chapter13") || chapters.includes("meansTest")
      ? "Untitled debtor"
      : "Untitled client";

  return (
    <>
      <ConvexStoreSync />
      <header
        className="sticky top-0 z-30 border-b border-[var(--rule-soft)] bg-[var(--paper)]"
        style={{ height: "var(--case-header-h)" }}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Link href="/" className="logo">
              Tabula<span className="logo-dot" />
            </Link>
            {backHref && (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)]">/</span>
                <Link
                  href={backHref}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)] hover:text-[var(--ink)]"
                >
                  ← All areas
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="pill">
              <span className="dot pulse" />
              {badgeLabel}
            </span>
            {isSignedIn ? (
              <UserButton />
            ) : (
              <Link
                href="/sign-in"
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10">
        <section className="space-y-6">
          <span className="pill">
            <span className="dot pulse" />
            {badgeLabel} workspace
          </span>
          <h1 className="display max-w-[14ch] text-[clamp(48px,7vw,96px)] text-[var(--ink)]">
            {heroTitle}
          </h1>
          <p className="max-w-[52ch] text-[15px] font-light leading-relaxed text-[var(--ink-2)]">
            {heroDesc}
          </p>

          {isSignedIn ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {createOptions.map((opt) => (
                <Button
                  key={opt.chapter}
                  variant={opt.variant ?? "default"}
                  onClick={() => onNew(opt.chapter)}
                >
                  {opt.label}
                </Button>
              ))}
              {extraActions && (
                <>
                  <span className="ml-1 h-3.5 w-px bg-[var(--rule)]" aria-hidden />
                  {extraActions}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link href="/sign-in">
                <Button>Sign in to get started</Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline">Create account</Button>
              </Link>
            </div>
          )}
        </section>

        {isSignedIn ? (
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

            {!isLoaded && list.length === 0 ? (
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
                  Use the button above to create your first case.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--rule-soft)] border-y border-[var(--rule-soft)]">
                {list.map((c, i) => {
                  const idShort = c.id.slice(-6).toUpperCase();
                  const isRenamingThis = renaming === c.id;
                  return (
                    <li key={c.id} className="group relative">
                      <Link
                        href={`/case/${c.id}`}
                        className="grid grid-cols-12 items-center gap-5 px-1 py-4 transition-colors hover:bg-[var(--paper-2)]"
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
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {isRenamingThis ? (
                              <input
                                ref={renameInputRef}
                                value={renameVal}
                                onChange={(e) => setRenameVal(e.target.value)}
                                onBlur={() => commitRename(c.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitRename(c.id);
                                  if (e.key === "Escape") setRenaming(null);
                                }}
                                onClick={(e) => e.preventDefault()}
                                className="flex-1 border-b border-[var(--ink)] bg-transparent text-[18px] leading-tight tracking-[-0.015em] text-[var(--ink)] outline-none"
                                style={{ fontFamily: "var(--serif)" }}
                              />
                            ) : (
                              <>
                                <p
                                  className="text-[18px] leading-tight tracking-[-0.015em] text-[var(--ink)] group-hover:text-[var(--accent-deep)]"
                                  style={{ fontFamily: "var(--serif)" }}
                                >
                                  {c.debtorName || (
                                    <em className="text-[var(--mute)]">
                                      {c.chapter === "meansTest"
                                        ? "Means-test draft"
                                        : untitledLabel}
                                    </em>
                                  )}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => startRename(c.id, c.debtorName, e)}
                                  className="hidden shrink-0 rounded p-0.5 text-[var(--mute)] opacity-0 transition-opacity hover:text-[var(--ink)] group-hover:opacity-100"
                                  aria-label="Rename case"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{chapterLabel(c.chapter)}</Badge>
                            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                              Updated{" "}
                              {new Date(c.updatedAt).toLocaleDateString(undefined, {
                                dateStyle: "medium",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-12 grid grid-cols-3 gap-3 md:col-span-5">
                          <CaseStats record={c} />
                        </div>
                        <div className="col-span-12 flex justify-end md:col-span-1">
                          <button
                            type="button"
                            onClick={(e) => onDelete(c.id, e)}
                            className="hidden rounded p-1 text-[var(--mute)] opacity-0 transition-opacity hover:text-[var(--destructive)] group-hover:opacity-100 group-hover:block"
                            aria-label="Delete case"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}
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
        <Stat label="State median" value={formatCurrency(r.medianAnnual / 12)} />
        <Stat
          label="Status"
          value={r.verdictLabel}
          accent={r.verdict === "below-median" || r.verdict === "safe-harbor"}
        />
      </>
    );
  }
  if (record.chapter === "personalInjury") {
    const s = piStats(record.forms);
    return (
      <>
        <Stat
          label="Incident type"
          value={
            s.incidentType
              ? (INCIDENT_TYPE_LABELS[s.incidentType] ?? s.incidentType)
              : "—"
          }
        />
        <Stat
          label="Incident date"
          value={
            s.incidentDate
              ? new Date(s.incidentDate).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })
              : "—"
          }
        />
        <Stat
          label="Est. damages"
          value={s.totalDamages > 0 ? formatCurrency(s.totalDamages) : "—"}
          accent={s.totalDamages > 0}
        />
      </>
    );
  }
  // Bankruptcy (chapter7, chapter13)
  const s = caseSummary(record);
  return (
    <>
      <Stat label="Assets" value={formatCurrency(s.assets.grand)} />
      <Stat label="Liabilities" value={formatCurrency(s.liabilities.grand)} />
      <Stat label="Monthly net" value={formatCurrency(s.net)} accent={s.net >= 0} />
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
