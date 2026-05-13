"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useCaseStore } from "@/state/case-store";
import { findIssues, type ReconciliationIssue } from "@/lib/estate/reconciliation";

export default function ReconciliationPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const record = useCaseStore((s) => s.cases[caseId]);

  const issues = useMemo(() => (record ? findIssues(record) : []), [record]);

  if (!record) return null;

  if (record.chapter !== "estateAdmin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Reconciliation is available only for estate-administration cases.
        </p>
        <Link
          href={`/case/${caseId}`}
          className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← Case overview
        </Link>
      </div>
    );
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8 space-y-8">
      <header className="space-y-2">
        <span className="tag">Reconciliation</span>
        <h1
          className="text-[32px] leading-[1.04] tracking-[-0.025em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          <em>Open issues</em>
        </h1>
        <p className="text-[13px] font-light text-[var(--ink-2)]">
          Cross-form checks: beneficiary designations against the will&apos;s
          residuary roster, share totals, tax-filing flags vs. gross-estate
          threshold, overdue deadlines.
        </p>
      </header>

      {issues.length === 0 ? (
        <div className="rounded-[3px] border border-dashed border-[var(--rule)] bg-[var(--paper-2)] px-5 py-9 text-center">
          <p
            className="text-[16px] tracking-[-0.01em] text-[var(--ink-2)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            <em>Nothing to reconcile.</em>
          </p>
          <p className="mt-1.5 text-[12px] text-[var(--mute)]">
            As you fill in the inventory and tax-coordination forms, conflicts
            and gaps will surface here.
          </p>
        </div>
      ) : (
        <>
          <IssueBlock title="Errors" tone="error" items={errors} caseId={caseId} />
          <IssueBlock title="Warnings" tone="warning" items={warnings} caseId={caseId} />
          <IssueBlock title="Informational" tone="info" items={infos} caseId={caseId} />
        </>
      )}
    </div>
  );
}

function IssueBlock({
  title,
  tone,
  items,
  caseId,
}: {
  title: string;
  tone: "error" | "warning" | "info";
  items: ReconciliationIssue[];
  caseId: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between border-b border-[var(--rule)] pb-2">
        <span className="tag">{title}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <ul className="divide-y divide-[var(--rule-soft)]">
        {items.map((issue) => {
          const href = issue.formId ? `/case/${caseId}/${issue.formId}` : undefined;
          const content = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="text-[15px] tracking-[-0.015em] text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  {issue.message}
                </span>
                <SeverityChip tone={tone} />
              </div>
              {issue.detail ? (
                <p className="mt-1 text-[12px] text-[var(--ink-2)]">{issue.detail}</p>
              ) : null}
              {issue.formId ? (
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  {issue.formId}
                  {issue.fieldPath ? ` · ${issue.fieldPath}` : ""}
                </p>
              ) : null}
            </>
          );
          return (
            <li key={issue.id} className="py-3">
              {href ? (
                <Link
                  href={href}
                  className="block transition-colors hover:bg-[var(--paper-2)] rounded-[2px] -mx-1 px-1"
                >
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SeverityChip({ tone }: { tone: "error" | "warning" | "info" }) {
  const label = tone === "error" ? "Error" : tone === "warning" ? "Warning" : "Info";
  return (
    <span
      className={
        "shrink-0 rounded-[2px] border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] " +
        (tone === "error"
          ? "border-[var(--destructive)] text-[var(--destructive)]"
          : tone === "warning"
          ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
          : "border-[var(--rule)] text-[var(--mute)]")
      }
    >
      {label}
    </span>
  );
}
