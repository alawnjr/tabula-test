"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useCaseStore } from "@/state/case-store";
import { FORM_ORDER, getSchema, chapterLabel, isRepeatingGroup } from "@/lib/schemas";
import type { Field, RepeatingGroup } from "@/lib/schemas";
import type { FormData } from "@/state/case-store";
import { formatCurrency } from "@/lib/currency";
import { caseSummary } from "@/lib/derived";
import { computeMeansTest } from "@/lib/meansTest";
import { DownloadFormButton } from "@/components/case/DownloadFormButton";
import { FORM_PDF_FILE, buildFieldMap, type FormMapperKey } from "@/lib/pdf/mappers";
import { fillPdf, downloadPdf } from "@/lib/pdf/fillPdf";

function formatValue(field: Field, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (field.type === "currency") return formatCurrency(value as string | number);
  if (field.type === "date") {
    const d = new Date(value as string);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  }
  if (field.type === "checkbox") return value ? "Yes" : "No";
  if ((field.type === "select" || field.type === "radio") && field.options) {
    const match = field.options.find((o) => o.value === String(value));
    return match?.label ?? String(value);
  }
  return String(value);
}

function FieldValueRow({ field, value }: { field: Field; value: unknown }) {
  if (field.type === "address") {
    return null;
  }
  return (
    <div className="print-field-row">
      <span className="print-field-label">{field.label}</span>
      <span className="print-field-value">{formatValue(field, value)}</span>
    </div>
  );
}

function RepeatingGroupPrint({
  group,
  formData,
}: {
  group: RepeatingGroup;
  formData: FormData;
}) {
  const items = Array.isArray(formData[group.id])
    ? (formData[group.id] as Record<string, unknown>[])
    : [];

  return (
    <div className="print-group">
      <p className="print-group-label">{group.label}</p>
      {items.length === 0 ? (
        <p className="print-empty">None entered.</p>
      ) : (
        <table className="print-table">
          <thead>
            <tr>
              {group.fields.map((f) => (
                <th key={f.id}>{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={i}>
                {group.fields.map((f) => (
                  <td key={f.id}>{formatValue(f, row[f.id])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SummaryBlock({ record }: { record: ReturnType<typeof useCaseStore.getState>["cases"][string] }) {
  const s = caseSummary(record);
  return (
    <div className="print-derived">
      <div className="print-field-row"><span className="print-field-label">Total assets</span><span className="print-field-value">{formatCurrency(s.assets.grand)}</span></div>
      <div className="print-field-row"><span className="print-field-label">Total secured liabilities</span><span className="print-field-value">{formatCurrency(s.liabilities.secured)}</span></div>
      <div className="print-field-row"><span className="print-field-label">Total priority unsecured</span><span className="print-field-value">{formatCurrency(s.liabilities.priority)}</span></div>
      <div className="print-field-row"><span className="print-field-label">Total nonpriority unsecured</span><span className="print-field-value">{formatCurrency(s.liabilities.nonpriority)}</span></div>
      <div className="print-field-row"><span className="print-field-label">Total liabilities</span><span className="print-field-value">{formatCurrency(s.liabilities.grand)}</span></div>
      <div className="print-field-row"><span className="print-field-label">Monthly income (combined)</span><span className="print-field-value">{formatCurrency(s.income.combined)}</span></div>
      <div className="print-field-row"><span className="print-field-label">Monthly expenses</span><span className="print-field-value">{formatCurrency(s.expenses)}</span></div>
      <div className="print-field-row"><span className="print-field-label">Monthly net</span><span className="print-field-value">{formatCurrency(s.net)}</span></div>
    </div>
  );
}

function MeansResultBlock({ record }: { record: ReturnType<typeof useCaseStore.getState>["cases"][string] }) {
  const r = computeMeansTest(record);
  return (
    <div className="print-derived">
      <div className="print-field-row"><span className="print-field-label">Verdict</span><span className="print-field-value">{r.verdictLabel}</span></div>
      <div className="print-field-row"><span className="print-field-label">Monthly CMI</span><span className="print-field-value">{formatCurrency(r.cmiMonthly)}</span></div>
      <div className="print-field-row"><span className="print-field-label">Annualized CMI</span><span className="print-field-value">{formatCurrency(r.cmiAnnual)}</span></div>
      <div className="print-field-row"><span className="print-field-label">State median (annualized)</span><span className="print-field-value">{formatCurrency(r.medianAnnual)}</span></div>
      {!r.belowMedian && (
        <>
          <div className="print-field-row"><span className="print-field-label">Total deductions</span><span className="print-field-value">{formatCurrency(r.totalDeductions)}</span></div>
          <div className="print-field-row"><span className="print-field-label">Monthly disposable</span><span className="print-field-value">{formatCurrency(r.monthlyDisposable)}</span></div>
          <div className="print-field-row"><span className="print-field-label">60-month disposable</span><span className="print-field-value">{formatCurrency(r.disposable60)}</span></div>
        </>
      )}
      <p className="print-detail">{r.verdictDetail}</p>
    </div>
  );
}

function DownloadAllButton({
  formIds,
  record,
}: {
  formIds: string[];
  record: ReturnType<typeof useCaseStore.getState>["cases"][string];
}) {
  const [loading, setLoading] = useState(false);

  const pdfFormIds = formIds.filter((id) => id in FORM_PDF_FILE);

  async function handleDownloadAll() {
    setLoading(true);
    try {
      const slug = record.debtorName?.replace(/\s+/g, "-").toLowerCase() || "debtor";
      for (let i = 0; i < pdfFormIds.length; i++) {
        const formId = pdfFormIds[i];
        const templateUrl = FORM_PDF_FILE[formId as FormMapperKey];
        const fields = buildFieldMap(formId as FormMapperKey, record);
        const bytes = await fillPdf(templateUrl, fields);
        downloadPdf(bytes, `${slug}-form-${formId}.pdf`);
        if (i < pdfFormIds.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (pdfFormIds.length === 0) return null;

  return (
    <button
      onClick={handleDownloadAll}
      disabled={loading}
      className="rounded-[3px] bg-[var(--ink)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--paper)] hover:opacity-80 disabled:opacity-40 transition-opacity"
    >
      {loading ? "Downloading…" : `Download all (${pdfFormIds.length})`}
    </button>
  );
}

export default function PrintPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const record = useCaseStore((s) => s.cases[caseId]);

  if (!record) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Loading…
        </p>
      </div>
    );
  }

  const formIds = FORM_ORDER[record.chapter];

  return (
    <>
      <style>{`
        .print-content { font-family: Georgia, serif; font-size: 11pt; color: #111; }
        .print-header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
        .print-header h1 { font-size: 16pt; margin: 0 0 4px; }
        .print-header p { margin: 0; font-size: 9pt; color: #555; font-family: monospace; letter-spacing: 0.06em; text-transform: uppercase; }
        .form-block { margin-bottom: 32px; }
        .form-block h2 { font-size: 13pt; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 0 0 12px; }
        .form-block h3 { font-size: 10pt; font-family: monospace; text-transform: uppercase; letter-spacing: 0.1em; color: #444; margin: 16px 0 6px; }
        .print-field-row { display: flex; gap: 8px; border-bottom: 1px dotted #e0e0e0; padding: 3px 0; }
        .print-field-label { flex: 0 0 44%; font-size: 9.5pt; color: #444; }
        .print-field-value { flex: 1; font-size: 9.5pt; color: #111; word-break: break-word; }
        .print-group { margin: 10px 0 14px; }
        .print-group-label { font-size: 9pt; font-family: monospace; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin-bottom: 4px; }
        .print-empty { font-size: 9pt; color: #888; font-style: italic; }
        .print-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
        .print-table th { background: #f4f4f4; border: 1px solid #ccc; padding: 3px 6px; text-align: left; font-weight: 600; }
        .print-table td { border: 1px solid #ddd; padding: 3px 6px; vertical-align: top; white-space: pre-wrap; word-break: break-word; }
        .print-derived { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px 12px; margin: 8px 0; }
        .print-detail { font-size: 9pt; color: #555; font-style: italic; margin: 8px 0 0; }
        @media print {
          .no-print { display: none !important; }
          body::before { display: none; }
          .print-content { color: black; background: white; }
          .form-block + .form-block { page-break-before: always; }
        }
      `}</style>

      <div className="no-print mx-auto max-w-3xl px-4 py-4 lg:px-8 flex flex-wrap items-center gap-3 border-b border-[var(--rule)]">
        <Link
          href={`/case/${caseId}`}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← Back
        </Link>
        <span className="text-[var(--rule)] select-none">|</span>
        <button
          onClick={() => window.print()}
          className="rounded-[3px] border border-[var(--rule)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
        >
          Print / Save summary
        </button>
        <span className="text-[var(--rule)] select-none">|</span>
        <DownloadAllButton formIds={formIds} record={record} />
        <span className="text-[var(--rule)] select-none">|</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">Per form:</span>
        {formIds.filter((id) => id in FORM_PDF_FILE).map((id) => (
          <DownloadFormButton key={id} formId={id} record={record} label={`Form ${id}`} />
        ))}
      </div>

      <div className="print-content mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <div className="print-header">
          <h1>{record.debtorName || "Unnamed Debtor"}</h1>
          <p>
            {chapterLabel(record.chapter)} · Filed{" "}
            {new Date(record.createdAt).toLocaleDateString()} · Case ID {caseId}
          </p>
        </div>

        {formIds.map((formId) => {
          const schema = getSchema(formId);
          if (!schema) return null;
          const formData = record.forms[formId] ?? {};

          return (
            <article key={formId} className="form-block">
              <div className="no-print flex items-center justify-between gap-4 mb-3">
                <h2 style={{ margin: 0, borderBottom: "none" }}>
                  Form {schema.id} — {schema.title}
                </h2>
                <DownloadFormButton formId={formId} record={record} />
              </div>
              <h2 className="print-only" style={{ display: "none" }}>
                Form {schema.id} — {schema.title}
              </h2>

              {schema.derived ? (
                formId === "122Result" ? (
                  <MeansResultBlock record={record} />
                ) : (
                  <SummaryBlock record={record} />
                )
              ) : (
                schema.sections.map((section) => (
                  <section key={section.id}>
                    <h3>{section.title}</h3>
                    {section.items.map((item) => {
                      if (isRepeatingGroup(item)) {
                        return (
                          <RepeatingGroupPrint
                            key={item.id}
                            group={item as RepeatingGroup}
                            formData={formData as FormData}
                          />
                        );
                      }
                      const field = item as Field;
                      return (
                        <FieldValueRow
                          key={field.id}
                          field={field}
                          value={formData[field.id]}
                        />
                      );
                    })}
                  </section>
                ))
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
