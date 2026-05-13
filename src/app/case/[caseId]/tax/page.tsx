"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useCaseStore } from "@/state/case-store";
import { eaStats } from "@/lib/derived";
import { formatCurrency } from "@/lib/currency";
import { FEDERAL_706_EXEMPTION, rulesFor } from "@/lib/estate/jurisdictions";

export default function TaxCoordinationPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const record = useCaseStore((s) => s.cases[caseId]);

  const stats = useMemo(() => (record ? eaStats(record.forms) : null), [record]);

  if (!record || !stats) return null;

  if (record.chapter !== "estateAdmin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Tax coordination is available only for estate-administration cases.
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

  const tax = (record.forms["ea-tax"] ?? {}) as Record<string, unknown>;
  const decedent = (record.forms["ea-decedent"] ?? {}) as Record<string, unknown>;
  const rules = rulesFor(stats.domicileState);

  const file706 = tax.filing706 === "yes";
  const fileState = tax.filingStateEstate === "yes";
  const file1041 = tax.filing1041 === "yes";

  const final1040Status = (decedent.final1040Status as string | undefined) ?? "unknown";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8 space-y-8">
      <header className="space-y-2">
        <span className="tag">Tax coordination</span>
        <h1
          className="text-[32px] leading-[1.04] tracking-[-0.025em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          <em>CPA packet</em>
        </h1>
        <p className="text-[13px] font-light text-[var(--ink-2)]">
          A consolidated view of what the CPA needs, organized by return.
          Update the underlying inventory and elections via the linked forms.
        </p>
      </header>

      <Section title="Gross-estate snapshot" linkHref={`/case/${caseId}/ea-inventory`}>
        <Row label="Real property" value={formatCurrency(stats.realProperty)} />
        <Row label="Financial accounts" value={formatCurrency(stats.financial)} />
        <Row label="Retirement accounts" value={formatCurrency(stats.retirement)} />
        <Row label="Life insurance" value={formatCurrency(stats.lifeInsurance)} />
        <Row label="Vehicles / personal / business" value={formatCurrency(stats.vehicles + stats.personal + stats.business)} />
        <Row label="Gross estate" value={formatCurrency(stats.grossEstate)} accent />
      </Section>

      <Section title="Federal Form 706" linkHref={`/case/${caseId}/ea-tax`}>
        <Row
          label="Required?"
          value={file706 ? "Yes" : "Not flagged"}
        />
        <Row label="Threshold (this year)" value={formatCurrency(FEDERAL_706_EXEMPTION)} />
        <Row
          label="Over threshold?"
          value={stats.grossEstate > FEDERAL_706_EXEMPTION ? "Yes" : "No"}
          accent={stats.grossEstate > FEDERAL_706_EXEMPTION}
        />
        <Row label="QTIP election" value={tax.qtipElection === "yes" ? "Yes" : "—"} />
        <Row
          label="Alternate-valuation election"
          value={tax.alternateValuationElection === "yes" ? "Yes" : "—"}
        />
        <Row
          label="Portability of DSUE"
          value={tax.portabilityElection === "yes" ? "Yes" : "—"}
        />
      </Section>

      {rules.stateEstateTaxFormName ? (
        <Section title={`${rules.label} state estate tax (${rules.stateEstateTaxFormName})`} linkHref={`/case/${caseId}/ea-tax`}>
          <Row label="Required?" value={fileState ? "Yes" : "Not flagged"} />
          {rules.stateEstateTaxExemption !== undefined ? (
            <Row label="State threshold" value={formatCurrency(rules.stateEstateTaxExemption)} />
          ) : null}
          <Row
            label="Over state threshold?"
            value={
              rules.stateEstateTaxExemption !== undefined
                ? stats.grossEstate > rules.stateEstateTaxExemption
                  ? "Yes"
                  : "No"
                : "—"
            }
            accent={
              rules.stateEstateTaxExemption !== undefined &&
              stats.grossEstate > rules.stateEstateTaxExemption
            }
          />
        </Section>
      ) : null}

      <Section title="Federal Form 1041 (income during administration)" linkHref={`/case/${caseId}/ea-tax`}>
        <Row label="Required?" value={file1041 ? "Yes" : "Not flagged"} />
        <Row
          label="Fiscal-year election"
          value={(tax.fiscalYearElection as string | undefined) ?? "—"}
        />
        <Row
          label="§645 election"
          value={tax.section645Election === "yes" ? "Yes" : "—"}
        />
        <Row
          label="Estate EIN obtained"
          value={(tax.ein as string | undefined) ?? "—"}
        />
      </Section>

      <Section title="Decedent's final 1040" linkHref={`/case/${caseId}/ea-decedent`}>
        <Row label="Status" value={final1040Status} />
        <Row label="Preparer" value={(decedent.preparerName as string | undefined) ?? "—"} />
      </Section>

      <Section title="CPA contact" linkHref={`/case/${caseId}/ea-tax`}>
        <Row label="Name" value={(tax.cpaName as string | undefined) ?? "—"} />
        <Row label="Email" value={(tax.cpaEmail as string | undefined) ?? "—"} />
        <Row label="Phone" value={(tax.cpaPhone as string | undefined) ?? "—"} />
      </Section>
    </div>
  );
}

function Section({ title, linkHref, children }: { title: string; linkHref?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between border-b border-[var(--rule)] pb-2">
        <span className="tag">{title}</span>
        {linkHref ? (
          <Link
            href={linkHref}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
          >
            Edit →
          </Link>
        ) : null}
      </div>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">{label}</dt>
      <dd
        className={
          "text-[14px] tabular-nums tracking-[-0.01em] " +
          (accent ? "text-[var(--accent-deep)]" : "text-[var(--ink)]")
        }
        style={{ fontFamily: "var(--serif)" }}
      >
        {value}
      </dd>
    </div>
  );
}
