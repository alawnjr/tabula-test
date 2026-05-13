"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type AccessRow = {
  _id: Id<"beneficiaryAccess">;
  caseId: Id<"cases">;
  email: string;
  name?: string;
  role: "beneficiary" | "executor-co";
  invitedAt: string;
  status: "invited" | "active" | "revoked";
};

export function BeneficiaryAccessPanel({ caseId }: { caseId: string }) {
  const accessList = useQuery(api.beneficiary.listForCase, {
    caseId: caseId as Id<"cases">,
  });
  const invite = useMutation(api.beneficiary.invite);
  const revoke = useMutation(api.beneficiary.revoke);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const portalUrl =
    typeof window !== "undefined" ? `${window.location.origin}/beneficiary` : "/beneficiary";

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await invite({
        caseId: caseId as Id<"cases">,
        email: email.trim(),
        name: name.trim() || undefined,
      });
      setEmail("");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper-2)] p-4 space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--mute)]">
          Beneficiary access
        </p>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Portal: <span className="text-[var(--ink-2)]">{portalUrl}</span>
        </span>
      </div>

      <form onSubmit={handleInvite} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          type="email"
          placeholder="beneficiary@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-[2px] border border-[var(--rule)] bg-[var(--paper)] px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--ink)]"
        />
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-[2px] border border-[var(--rule)] bg-[var(--paper)] px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--ink)]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[2px] bg-[var(--ink)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--paper)] hover:opacity-80 disabled:opacity-40"
        >
          {submitting ? "Inviting…" : "Invite"}
        </button>
      </form>
      {error ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--destructive)]">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-[var(--rule-soft)] border-y border-[var(--rule-soft)]">
        {accessList === undefined ? (
          <li className="py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
            Loading…
          </li>
        ) : accessList.length === 0 ? (
          <li className="py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
            No beneficiaries invited yet.
          </li>
        ) : (
          (accessList as AccessRow[]).map((a) => (
            <li
              key={a._id}
              className="flex items-baseline justify-between gap-3 py-2"
            >
              <div>
                <p
                  className="text-[14px] tracking-[-0.01em] text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  {a.name ?? a.email}
                </p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  {a.email} · {a.role} · {a.status}
                </p>
              </div>
              {a.status !== "revoked" ? (
                <button
                  onClick={() => revoke({ accessId: a._id })}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--destructive)]"
                >
                  Revoke
                </button>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  Revoked
                </span>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
