"use client";

import Link from "next/link";
import { useCaseStore } from "@/state/case-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { chapterLabel } from "@/lib/schemas";
import { ImportExport } from "./ImportExport";

export function CaseHeader({ caseId }: { caseId: string }) {
  const record = useCaseStore((s) => s.cases[caseId]);
  if (!record) return null;
  const idShort = record.id.slice(-6).toUpperCase();

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--rule-soft)] bg-[var(--paper)]"
      style={{ height: "var(--case-header-h)" }}
    >
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="logo shrink-0">
            Case Builder
            <span className="logo-dot" />
          </Link>

          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)]">
            /
          </span>

          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)] hover:text-[var(--ink)] shrink-0"
          >
            ← Cases
          </Link>

          <span className="hidden font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)] sm:inline">
            ·
          </span>

          <p
            className="hidden text-[14px] tracking-[-0.01em] text-[var(--ink)] truncate sm:inline-flex sm:items-baseline sm:gap-2"
            style={{ fontFamily: "var(--serif)" }}
          >
            <span className="truncate">
              {record.debtorName || (
                <em className="text-[var(--mute)]">Untitled debtor</em>
              )}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)] shrink-0">
              № {idShort}
            </span>
          </p>

          <Badge variant="outline">{chapterLabel(record.chapter)}</Badge>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ImportExport caseId={caseId} />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm("Delete this case? This cannot be undone.")) {
                useCaseStore.getState().deleteCase(caseId);
                window.location.href = "/";
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </header>
  );
}
