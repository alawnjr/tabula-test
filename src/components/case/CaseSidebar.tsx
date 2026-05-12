"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCaseStore } from "@/state/case-store";
import { useReviewStore } from "@/state/review-store";
import { FORM_ORDER, getSchema } from "@/lib/schemas";
import { computeFormCompletion, type FormCompletion } from "@/lib/completion";
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
  const printHref = `/case/${caseId}/print`;
  const filesHref = `/case/${caseId}/files`;
  const assistantHref = `/case/${caseId}/assistant`;

  const meansTestIds = ["122A-1", "122A-2", "122Result"];
  // Only show the linked means-test section for bankruptcy chapters (not PI/RE)
  const isBankruptcy =
    record.chapter === "chapter7" ||
    record.chapter === "chapter13" ||
    record.chapter === "meansTest";
  const hasMeansTestData =
    isBankruptcy &&
    record.chapter !== "meansTest" &&
    meansTestIds.some(
      (id) => Object.keys(record.forms[id] ?? {}).length > 0
    );

  // Roll-up completion across all schedule forms in this chapter (excluding
  // derived ones like 106Sum).
  const rollup = ids.reduce(
    (acc, id) => {
      const s = getSchema(id);
      if (!s || s.derived) return acc;
      const c = computeFormCompletion(s, record.forms[id]);
      acc.filled += c.filled;
      acc.total += c.total;
      acc.requiredMissing += c.requiredMissing;
      return acc;
    },
    { filled: 0, total: 0, requiredMissing: 0 }
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
          label="Data intake"
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
        <SidebarLink
          href={printHref}
          label="Print / Export PDF"
          active={pathname === printHref}
        />
        <SidebarLink
          href={filesHref}
          label="Files"
          active={pathname === filesHref}
        />
        <SidebarLink
          href={assistantHref}
          label="Virtual Assistant"
          active={pathname === assistantHref}
        />
      </div>

      <div className="space-y-0.5">
        <div className="flex items-baseline justify-between px-1.5 pb-1.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
            Forms & schedules
          </p>
          {rollup.total > 0 ? (
            <span className="font-mono text-[9px] tabular-nums tracking-[0.05em] text-[var(--mute)]">
              {rollup.filled}/{rollup.total}
              {rollup.requiredMissing > 0 ? (
                <span
                  className="ml-1 text-[var(--destructive)]"
                  title={`${rollup.requiredMissing} required missing`}
                >
                  ●
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
        {ids.map((id) => {
          const s = getSchema(id);
          if (!s) return null;
          const href = `/case/${caseId}/${id}`;
          const completion = computeFormCompletion(s, record.forms[id]);
          return (
            <SidebarLink
              key={id}
              href={href}
              label={s.title}
              meta={`Form ${s.id}`}
              active={pathname === href}
              completion={completion}
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
            const completion = computeFormCompletion(s, record.forms[id]);
            return (
              <SidebarLink
                key={id}
                href={href}
                label={s.title}
                meta={s.id === "122Result" ? "Result" : `Form ${s.id}`}
                active={pathname === href}
                completion={completion}
              />
            );
          })}
        </div>
      ) : null}
    </nav>
  );
}

function statusFor(c: FormCompletion): {
  chip: string;
  tone: "muted" | "accent" | "deep" | "danger";
} {
  if (c.derived) return { chip: "auto", tone: "deep" };
  if (c.total === 0) return { chip: "—", tone: "muted" };
  if (c.complete) return { chip: "✓", tone: "deep" };
  if (c.filled === 0) return { chip: "—", tone: "muted" };
  if (c.requiredMissing > 0) {
    return { chip: `${c.filled}/${c.total}`, tone: "danger" };
  }
  return { chip: `${c.filled}/${c.total}`, tone: "accent" };
}

function SidebarLink({
  href,
  label,
  meta,
  active,
  chip,
  chipTone,
  completion,
}: {
  href: string;
  label: string;
  meta?: string;
  active: boolean;
  chip?: string;
  chipTone?: "muted" | "accent" | "deep" | "danger";
  completion?: FormCompletion;
}) {
  const status = completion ? statusFor(completion) : null;
  const finalChip = status?.chip ?? chip;
  const finalTone = status?.tone ?? chipTone;
  const showProgress =
    !!completion &&
    !completion.derived &&
    completion.total > 0 &&
    completion.filled > 0 &&
    !completion.complete;
  const progressPct = showProgress
    ? Math.max(2, Math.round((completion!.filled / completion!.total) * 100))
    : 0;

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-1 rounded-[3px] px-2 py-1.5 transition-colors",
        active
          ? "bg-[var(--paper-3)] text-[var(--ink)]"
          : "text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
      )}
    >
      <span className="flex items-center justify-between gap-2">
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
        {finalChip ? (
          <span
            className={cn(
              "shrink-0 rounded-[2px] px-1.5 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.1em] tabular-nums",
              finalTone === "muted" &&
                "bg-[var(--paper-3)] text-[var(--mute)]",
              finalTone === "accent" &&
                "bg-[var(--accent-bg)] text-[var(--accent-ink)]",
              finalTone === "deep" &&
                "bg-[var(--accent-deep)] text-[var(--paper)]",
              finalTone === "danger" &&
                "bg-[var(--destructive)] text-[var(--destructive-foreground)]"
            )}
            title={
              completion
                ? completion.derived
                  ? "Auto-calculated from other forms"
                  : completion.complete
                  ? "All visible fields filled"
                  : completion.requiredMissing > 0
                  ? `${completion.requiredMissing} required missing · ${completion.filled} of ${completion.total} fields filled`
                  : `${completion.filled} of ${completion.total} fields filled`
                : undefined
            }
          >
            {finalChip}
          </span>
        ) : null}
      </span>
      {showProgress ? (
        <span
          aria-hidden
          className="block h-[2px] w-full overflow-hidden rounded-full bg-[var(--paper-3)]"
        >
          <span
            className={cn(
              "block h-full",
              completion!.requiredMissing > 0
                ? "bg-[var(--destructive)]"
                : "bg-[var(--accent-deep)]"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </span>
      ) : null}
    </Link>
  );
}
