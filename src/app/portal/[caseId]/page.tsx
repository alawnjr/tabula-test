"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { chapterLabel, practiceAreaOf } from "@/lib/schemas";
import { PortalProgress } from "@/components/portal/PortalProgress";
import { caseSummary } from "@/lib/derived";
import { formatCurrency } from "@/lib/currency";
import type { ChapterId } from "@/lib/schemas/types";
import type { CaseRecord } from "@/state/case-store";

export default function PortalCaseOverview({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const raw = useQuery(api.cases.get, { id: caseId as Id<"cases"> });

  if (raw === undefined) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
        Loading…
      </p>
    );
  }
  if (!raw) {
    return (
      <div className="space-y-2">
        <p className="text-[14px] text-[var(--ink)]">Case not found or not shared with you.</p>
        <Link href="/portal" className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]">
          ← Back to portal
        </Link>
      </div>
    );
  }

  // Build a minimal CaseRecord from the Convex document so we can use derived helpers
  const data = (raw.data ?? {}) as Record<string, unknown>;
  const record: CaseRecord = {
    id: raw._id,
    chapter: raw.chapter as ChapterId,
    debtorName: raw.debtorName,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forms: (data.forms as any) ?? {},
  };

  const s =
    practiceAreaOf(raw.chapter as ChapterId) === "bankruptcy" &&
    raw.chapter !== "meansTest"
      ? caseSummary(record)
      : null;
  const idShort = raw._id.slice(-6).toUpperCase();

  const practiceArea = practiceAreaOf(raw.chapter as ChapterId);
  const uploadDesc =
    practiceArea === "personalInjury"
      ? "Medical records, police reports, insurance documents"
      : practiceArea === "realEstate"
      ? "Purchase agreements, title documents, financial records"
      : "Bank statements, pay stubs, tax returns";
  const formsDesc =
    practiceArea === "bankruptcy"
      ? "Official court forms pre-filled with your data"
      : "Case documents pre-filled with your data";

  const actions = [
    {
      href: `/portal/${caseId}/intake`,
      label: "Your information",
      description: "Fill in your personal details and case information",
      icon: "📝",
    },
    {
      href: `/portal/${caseId}/upload`,
      label: "Upload documents",
      description: uploadDesc,
      icon: "📄",
    },
    {
      href: `/portal/${caseId}/forms`,
      label: "Download forms",
      description: formsDesc,
      icon: "⬇️",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/portal"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
          >
            ← Back
          </Link>
          <h1
            className="mt-2 text-[24px] tracking-[-0.02em] text-[var(--ink)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            {raw.debtorName || (
            <em className="text-[var(--mute)]">
              {practiceAreaOf(raw.chapter as ChapterId) === "bankruptcy"
                ? "Unnamed debtor"
                : "Unnamed client"}
            </em>
          )}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{chapterLabel(raw.chapter as ChapterId)}</Badge>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
              Case № {idShort}
            </span>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {s && (
        <div className="grid grid-cols-3 gap-4 rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper-2)] p-4">
          <Stat label="Total assets" value={formatCurrency(s.assets.grand)} />
          <Stat label="Total liabilities" value={formatCurrency(s.liabilities.grand)} />
          <Stat
            label="Monthly net"
            value={formatCurrency(s.net)}
            accent={s.net >= 0}
          />
        </div>
      )}

      {/* Progress */}
      <div className="rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper)] p-5">
        <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Filing progress
        </p>
        <PortalProgress record={record} />
      </div>

      {/* Action cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex flex-col gap-2 rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper)] p-4 transition-colors hover:border-[var(--ink)] hover:bg-[var(--paper-2)]"
          >
            <span className="text-[20px]">{a.icon}</span>
            <p
              className="text-[15px] tracking-[-0.01em] text-[var(--ink)]"
              style={{ fontFamily: "var(--serif)" }}
            >
              {a.label}
            </p>
            <p className="text-[12px] text-[var(--mute)]">{a.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">{label}</p>
      <p
        className={"mt-0.5 text-[15px] tracking-[-0.01em] tabular-nums " + (accent ? "text-[var(--accent-deep)]" : "text-[var(--ink)]")}
        style={{ fontFamily: "var(--serif)" }}
      >
        {value}
      </p>
    </div>
  );
}
