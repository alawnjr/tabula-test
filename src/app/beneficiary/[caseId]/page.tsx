"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function BeneficiaryEstatePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const data = useQuery(api.beneficiary.getEstateAsBeneficiary, {
    caseId: caseId as Id<"cases">,
  });

  if (data === undefined) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
        Loading…
      </p>
    );
  }
  if (data === null) {
    return (
      <div className="space-y-3">
        <p className="text-[14px] text-[var(--ink)]">
          You don&apos;t have access to this estate, or the executor revoked it.
        </p>
        <Link
          href="/beneficiary"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← All estates
        </Link>
      </div>
    );
  }

  const myShare = data.beneficiaries.find(
    (b: Record<string, unknown>) => typeof b.name === "string"
  );

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Link
          href="/beneficiary"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← All estates
        </Link>
        <h1
          className="mt-2 text-[28px] tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          Estate of <em>{data.decedentName || "Unnamed"}</em>
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Your role: {data.role}
        </p>
      </div>

      <section className="space-y-3 rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper-2)] p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--mute)]">
          Status
        </p>
        <Row
          label="Date of death"
          value={
            data.decedentDod
              ? new Date(String(data.decedentDod)).toLocaleDateString(undefined, { dateStyle: "medium" })
              : "—"
          }
        />
        <Row label="Domicile" value={data.domicileState ? String(data.domicileState) : "—"} />
        <Row
          label="Letters status"
          value={data.letterStatus ? String(data.letterStatus) : "—"}
        />
        <Row
          label="Letters issued"
          value={
            data.lettersIssuedDate
              ? new Date(String(data.lettersIssuedDate)).toLocaleDateString(undefined, { dateStyle: "medium" })
              : "—"
          }
        />
      </section>

      <section className="space-y-3">
        <p className="tag">Roster</p>
        <ul className="divide-y divide-[var(--rule-soft)] border-y border-[var(--rule-soft)]">
          {data.beneficiaries.length === 0 ? (
            <li className="py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
              Roster not yet recorded.
            </li>
          ) : (
            data.beneficiaries.map((b: Record<string, unknown>, i: number) => (
              <li key={i} className="flex items-baseline justify-between gap-3 py-2.5">
                <span
                  className="text-[15px] tracking-[-0.015em] text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  {(b.name as string | undefined) ?? "—"}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  {(b.relationship as string | undefined) ?? "—"}
                  {b.sharePercent ? ` · ${String(b.sharePercent)}%` : ""}
                  {b.waiverStatus ? ` · ${String(b.waiverStatus)}` : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <p className="tag">Actions</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/beneficiary/${caseId}/waivers`}
            className="rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper)] p-4 hover:border-[var(--ink)]"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
              Sign waiver / consent
            </p>
            <p
              className="mt-1 text-[15px] tracking-[-0.015em] text-[var(--ink)]"
              style={{ fontFamily: "var(--serif)" }}
            >
              Receipt &amp; release
            </p>
          </Link>
          <Link
            href={`/beneficiary/${caseId}/documents`}
            className="rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper)] p-4 hover:border-[var(--ink)]"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
              Documents
            </p>
            <p
              className="mt-1 text-[15px] tracking-[-0.015em] text-[var(--ink)]"
              style={{ fontFamily: "var(--serif)" }}
            >
              Upload requested files
            </p>
          </Link>
        </div>
      </section>

      {myShare ? null : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
        {label}
      </span>
      <span
        className="text-[14px] tabular-nums text-[var(--ink)]"
        style={{ fontFamily: "var(--serif)" }}
      >
        {value}
      </span>
    </div>
  );
}
