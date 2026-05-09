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
  const overviewHref = `/case/${caseId}`;
  const reviewHref = `/case/${caseId}/review`;

  return (
    <nav className="space-y-5 text-sm">
      <div className="space-y-0.5">
        <p className="px-1.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Workspace
        </p>
        <SidebarLink
          href={overviewHref}
          label="Overview"
          active={pathname === overviewHref}
        />
        <SidebarLink
          href={dataHref}
          label="Data room"
          active={pathname === dataHref}
          chip={txCount === 0 ? undefined : `${txCount} tx`}
          chipTone={txCount === 0 ? "muted" : "accent"}
        />
        <SidebarLink
          href={reviewHref}
          label="Review queue"
          active={pathname === reviewHref}
        />
      </div>

      <div className="space-y-0.5">
        <p className="px-1.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
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
          const status = s.derived
            ? "derived"
            : filledKeys.length === 0
            ? "empty"
            : "in-progress";

          return (
            <SidebarLink
              key={id}
              href={href}
              label={s.title}
              meta={`Form ${s.id}`}
              active={pathname === href}
              chip={
                status === "empty"
                  ? "—"
                  : status === "in-progress"
                  ? "•"
                  : "auto"
              }
              chipTone={
                status === "empty"
                  ? "muted"
                  : status === "in-progress"
                  ? "accent"
                  : "deep"
              }
            />
          );
        })}
      </div>
    </nav>
  );
}

function SidebarLink({
  href,
  label,
  meta,
  active,
  chip,
  chipTone,
}: {
  href: string;
  label: string;
  meta?: string;
  active: boolean;
  chip?: string;
  chipTone?: "muted" | "accent" | "deep";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between gap-2 rounded-[3px] px-2 py-1.5 transition-colors",
        active
          ? "bg-[var(--paper-3)] text-[var(--ink)]"
          : "text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
      )}
    >
      <span className="min-w-0 flex-1 leading-tight">
        {meta ? (
          <span className="block font-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--mute)]">
            {meta}
          </span>
        ) : null}
        <span
          className={cn(
            "block truncate text-[13px] tracking-[-0.01em]",
            active ? "text-[var(--ink)]" : ""
          )}
          style={{ fontFamily: "var(--serif)" }}
        >
          {label}
        </span>
      </span>
      {chip ? (
        <span
          className={cn(
            "shrink-0 rounded-[2px] px-1.5 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.1em]",
            chipTone === "muted" &&
              "bg-[var(--paper-3)] text-[var(--mute)]",
            chipTone === "accent" &&
              "bg-[var(--accent-bg)] text-[var(--accent-ink)]",
            chipTone === "deep" &&
              "bg-[var(--accent-deep)] text-[var(--paper)]"
          )}
        >
          {chip}
        </span>
      ) : null}
    </Link>
  );
}
