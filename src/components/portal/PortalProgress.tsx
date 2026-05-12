"use client";

import { FORM_ORDER, getSchema } from "@/lib/schemas";
import { computeFormCompletion } from "@/lib/completion";
import type { CaseRecord } from "@/state/case-store";
import type { ChapterId } from "@/lib/schemas/types";
import { cn } from "@/lib/utils";

export function PortalProgress({ record }: { record: CaseRecord }) {
  const ids = FORM_ORDER[record.chapter as ChapterId] ?? [];

  const completions = ids.map((id) => {
    const schema = getSchema(id);
    if (!schema || schema.derived) return null;
    const c = computeFormCompletion(schema, record.forms[id]);
    return { id, schema, c };
  }).filter(Boolean) as { id: string; schema: NonNullable<ReturnType<typeof getSchema>>; c: ReturnType<typeof computeFormCompletion> }[];

  const totalFilled = completions.reduce((a, x) => a + x.c.filled, 0);
  const totalItems = completions.reduce((a, x) => a + x.c.total, 0);
  const pct = totalItems > 0 ? Math.round((totalFilled / totalItems) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Overall completion
        </p>
        <span className="font-mono text-[11px] tabular-nums text-[var(--ink)]">
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--rule-soft)]">
        <div
          className="h-full rounded-full bg-[var(--accent-deep)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-1.5 pt-1">
        {completions.map(({ id, schema, c }) => {
          const rowPct = c.total > 0 ? Math.round((c.filled / c.total) * 100) : 0;
          return (
            <div key={id} className="grid grid-cols-[1fr_auto_56px] items-center gap-3">
              <p className="truncate font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
                {schema.title}
              </p>
              <div className="h-1 w-20 overflow-hidden rounded-full bg-[var(--rule-soft)]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    c.complete ? "bg-[var(--accent-deep)]" : "bg-[var(--mute)]"
                  )}
                  style={{ width: `${rowPct}%` }}
                />
              </div>
              <p className="text-right font-mono text-[9px] tabular-nums text-[var(--mute)]">
                {c.filled}/{c.total}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
