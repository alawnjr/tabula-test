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

  return (
    <header className="flex items-center justify-between border-b border-border bg-background/80 px-6 py-3 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All cases
        </Link>
        <span className="text-sm">/</span>
        <p className="text-sm font-medium">
          {record.debtorName || "Untitled debtor"}
        </p>
        <Badge variant="secondary">{chapterLabel(record.chapter)}</Badge>
      </div>
      <div className="flex items-center gap-2">
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
    </header>
  );
}
