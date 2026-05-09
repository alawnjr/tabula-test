"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCaseStore } from "@/state/case-store";
import { useReviewStore } from "@/state/review-store";
import { FORM_ORDER, getSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function CaseSidebar({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const record = useCaseStore((s) => s.cases[caseId]);
  const allPatches = useReviewStore(
    (s) => s.bundles[caseId]?.patches
  );
  if (!record) return null;
  const ids = FORM_ORDER[record.chapter];
  const allowed = new Set(ids);
  const reviewCount = (allPatches ?? []).filter((p) =>
    allowed.has(p.formId)
  ).length;

  const txCount = record.bankData?.doc.transactions?.length ?? 0;
  const dataHref = `/case/${caseId}/data`;
  const overviewHref = `/case/${caseId}`;
  const reviewHref = `/case/${caseId}/review`;

  // Show the means-test reference group only when this case carries data
  // from a means-test branch — otherwise it's noise on a fresh ch7/13 case.
  const meansTestIds = ["122A-1", "122A-2", "122Result"];
  const hasMeansTestData =
    record.chapter !== "meansTest" &&
    meansTestIds.some(
      (id) => Object.keys(record.forms[id] ?? {}).length > 0
    );

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
          chip={reviewCount > 0 ? String(reviewCount) : undefined}
          chipTone={reviewCount > 0 ? "deep" : "muted"}
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

      {hasMeansTestData ? (
        <div className="space-y-0.5">
          <p className="px-1.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
            Means test
          </p>
          {meansTestIds.map((id) => {
            const s = getSchema(id);
            if (!s) return null;
            const href = `/case/${caseId}/${id}`;
            const filledKeys = Object.keys(record.forms[id] ?? {}).filter(
              (k) => {
                const v = (record.forms[id] ?? {})[k];
                if (Array.isArray(v)) return v.length > 0;
                if (v == null || v === "") return false;
                return true;
              }
            );
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
                meta={s.id === "122Result" ? "Result" : `Form ${s.id}`}
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
      ) : null}
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
