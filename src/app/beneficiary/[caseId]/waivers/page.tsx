"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function WaiverPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const data = useQuery(api.beneficiary.getEstateAsBeneficiary, {
    caseId: caseId as Id<"cases">,
  });
  const submitWaiver = useMutation(api.beneficiary.submitWaiver);
  const [name, setName] = useState("");
  const [signature, setSignature] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (data === undefined) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
        Loading…
      </p>
    );
  }
  if (data === null) {
    return (
      <p className="text-[14px] text-[var(--ink)]">
        You don&apos;t have access to this estate.
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await submitWaiver({
        caseId: caseId as Id<"cases">,
        beneficiaryName: name,
        signature,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={`/beneficiary/${caseId}`}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← Estate overview
        </Link>
        <h1
          className="mt-2 text-[24px] tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          <em>Waiver &amp; receipt</em>
        </h1>
        <p className="text-[13px] text-[var(--ink-2)]">
          By signing below, you confirm receipt of your distribution from the
          estate and release the executor from further claims as to the items
          listed in the accounting.
        </p>
      </div>

      {saved ? (
        <div className="rounded-[3px] border border-[var(--accent-deep)] bg-[var(--paper-2)] p-4 text-[14px] text-[var(--ink)]">
          Thank you. Your signed waiver has been recorded. The executor has been
          notified.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
              Your name (must match the roster)
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-[2px] border border-[var(--rule)] bg-[var(--paper-2)] px-2.5 py-1.5 text-[14px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
              Signature (type your full name)
            </span>
            <input
              type="text"
              required
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="mt-1 w-full rounded-[2px] border border-[var(--rule)] bg-[var(--paper-2)] px-2.5 py-1.5 text-[14px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
              placeholder="Jane M. Doe"
            />
          </label>
          {error ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--destructive)]">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-[3px] bg-[var(--ink)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--paper)] hover:opacity-80 disabled:opacity-40"
          >
            {saving ? "Submitting…" : "Sign and submit"}
          </button>
        </form>
      )}
    </div>
  );
}
