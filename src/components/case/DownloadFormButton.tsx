"use client";

import { useState } from "react";
import { fillPdf, downloadPdf } from "@/lib/pdf/fillPdf";
import { buildFieldMap, FORM_PDF_FILE, type FormMapperKey } from "@/lib/pdf/mappers";
import type { CaseRecord } from "@/state/case-store";

interface Props {
  formId: string;
  record: CaseRecord;
  label?: string;
}

export function DownloadFormButton({ formId, record, label }: Props) {
  const [loading, setLoading] = useState(false);

  const pdfFile = FORM_PDF_FILE[formId as FormMapperKey];
  if (!pdfFile) return null;

  async function handleClick() {
    setLoading(true);
    try {
      const fields = buildFieldMap(formId as FormMapperKey, record);
      const bytes = await fillPdf(pdfFile, fields);
      const slug = record.debtorName?.replace(/\s+/g, "-").toLowerCase() || "debtor";
      downloadPdf(bytes, `${slug}-form-${formId}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-[3px] border border-[var(--rule)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)] hover:border-[var(--ink)] hover:text-[var(--ink)] disabled:opacity-40 transition-colors"
    >
      {loading ? "Generating…" : (label ?? `Download Form ${formId}`)}
    </button>
  );
}
