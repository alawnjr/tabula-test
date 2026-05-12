"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useCaseStore } from "@/state/case-store";
import { FORM_ORDER, getSchema, chapterLabel } from "@/lib/schemas";
import { DownloadFormButton } from "@/components/case/DownloadFormButton";
import { FORM_PDF_FILE } from "@/lib/pdf/mappers";
import type { ChapterId } from "@/lib/schemas/types";

export default function PortalFormsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const raw = useQuery(api.cases.get, { id: caseId as Id<"cases"> });
  const loadCase = useCaseStore((s) => s.loadCase);
  const setActive = useCaseStore((s) => s.setActiveCase);
  const record = useCaseStore((s) => s.cases[caseId]);

  useEffect(() => {
    if (raw && !record) {
      const data = (raw.data ?? {}) as Record<string, unknown>;
      loadCase({
        id: raw._id,
        chapter: raw.chapter as ChapterId,
        debtorName: raw.debtorName,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        forms: (data.forms as any) ?? {},
      });
      setActive(caseId);
    }
  }, [raw, record, loadCase, setActive, caseId]);

  if (!raw || !record) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
        Loading…
      </p>
    );
  }

  const formIds = FORM_ORDER[raw.chapter as ChapterId] ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={`/portal/${caseId}`}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← Back to overview
        </Link>
        <h1
          className="mt-2 text-[22px] tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          Download official forms
        </h1>
        <p className="text-[13px] text-[var(--ink-2)]">
          These are the official US Bankruptcy Court forms, pre-filled with your case data. Download any form as a PDF.
        </p>
      </div>

      <p className="rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper-2)] px-3 py-2.5 text-[12px] text-[var(--ink-2)]">
        <span className="font-medium">Note:</span> Forms are filled with data your attorney has entered. Contact your attorney before submitting any form to the court.
      </p>

      <ul className="divide-y divide-[var(--rule-soft)] border-y border-[var(--rule-soft)]">
        {formIds.map((formId) => {
          const schema = getSchema(formId);
          if (!schema) return null;
          const hasOfficialPdf = formId in FORM_PDF_FILE;
          return (
            <li key={formId} className="flex items-center justify-between gap-4 py-3.5 px-1">
              <div>
                <p
                  className="text-[14px] tracking-[-0.01em] text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  Form {schema.id} — {schema.title}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
                  {chapterLabel(raw.chapter as ChapterId)}
                </p>
              </div>
              {hasOfficialPdf ? (
                <DownloadFormButton formId={formId} record={record} label="Download PDF" />
              ) : (
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
                  Not available
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
