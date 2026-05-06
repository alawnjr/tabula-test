"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCaseStore } from "@/state/case-store";
import { FORM_ORDER, getSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function CaseSidebar({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const record = useCaseStore((s) => s.cases[caseId]);
  if (!record) return null;
  const ids = FORM_ORDER[record.chapter];

  const txCount = record.bankData?.doc.transactions?.length ?? 0;
  const dataHref = `/case/${caseId}/data`;

  return (
    <nav className="space-y-1 text-sm">
      <Link
        href={`/case/${caseId}`}
        className={cn(
          "block rounded-md px-3 py-2 hover:bg-accent",
          pathname === `/case/${caseId}` && "bg-accent font-medium"
        )}
      >
        Overview
      </Link>
      <Link
        href={dataHref}
        className={cn(
          "flex items-center justify-between gap-2 rounded-md px-3 py-2 hover:bg-accent",
          pathname === dataHref && "bg-accent font-medium"
        )}
      >
        <span className="truncate">Data</span>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            txCount === 0
              ? "bg-muted text-muted-foreground"
              : "bg-emerald-100 text-emerald-900"
          )}
        >
          {txCount === 0 ? "Empty" : `${txCount} tx`}
        </span>
      </Link>
      <p className="px-3 pt-4 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
        Forms & schedules
      </p>
      {ids.map((id) => {
        const s = getSchema(id);
        if (!s) return null;
        const href = `/case/${caseId}/${id}`;
        const filledKeys = Object.keys(record.forms[id] ?? {}).filter((k) => {
          const v = (record.forms[id] ?? {})[k];
          if (Array.isArray(v)) return v.length > 0;
          if (v == null || v === "") return false;
          return true;
        });
        const status =
          s.derived
            ? "derived"
            : filledKeys.length === 0
            ? "empty"
            : "in-progress";
        return (
          <Link
            key={id}
            href={href}
            className={cn(
              "flex items-center justify-between gap-2 rounded-md px-3 py-2 hover:bg-accent",
              pathname === href && "bg-accent font-medium"
            )}
          >
            <span className="truncate">{s.title}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                status === "empty" && "bg-muted text-muted-foreground",
                status === "in-progress" && "bg-emerald-100 text-emerald-900",
                status === "derived" && "bg-amber-100 text-amber-900"
              )}
            >
              {status === "empty"
                ? "Empty"
                : status === "in-progress"
                ? "Started"
                : "Auto"}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
