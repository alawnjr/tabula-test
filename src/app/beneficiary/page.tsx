"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";

type EstateSummary = {
  accessId: string;
  caseId: string;
  role: "beneficiary" | "executor-co";
  status: "invited" | "active" | "revoked";
  decedentName: string;
  chapter: string;
};

export default function BeneficiaryIndex() {
  const { isSignedIn } = useUser();
  const estates = useQuery(api.beneficiary.listMyEstates, isSignedIn ? {} : "skip");

  if (!isSignedIn) {
    return (
      <div className="space-y-3">
        <h1
          className="text-[28px] tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          <em>Beneficiary portal</em>
        </h1>
        <p className="text-[13px] text-[var(--ink-2)]">
          Sign in with the email address the executor invited you with to access
          your estate&apos;s status, request documents, and sign waivers.
        </p>
        <div className="flex gap-2 pt-2">
          <Link
            href="/sign-in"
            className="rounded-[3px] bg-[var(--ink)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--paper)] hover:opacity-80"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-[3px] border border-[var(--rule)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  if (estates === undefined) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
        Loading…
      </p>
    );
  }

  if (estates.length === 0) {
    return (
      <div className="space-y-3">
        <h1
          className="text-[28px] tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          <em>No estates yet</em>
        </h1>
        <p className="text-[13px] text-[var(--ink-2)]">
          You have not been invited to any estates. If you were expecting access,
          confirm with the executor that they used the same email address you
          signed in with.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <span className="tag">Beneficiary</span>
        <h1
          className="text-[28px] tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          <em>Your estates</em>
        </h1>
      </div>
      <ul className="divide-y divide-[var(--rule-soft)] border-y border-[var(--rule-soft)]">
        {(estates as EstateSummary[]).map((e) => (
          <li key={e.caseId}>
            <Link
              href={`/beneficiary/${e.caseId}`}
              className="flex items-center justify-between gap-3 py-3 px-1 hover:bg-[var(--paper-2)]"
            >
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  Estate of
                </p>
                <p
                  className="text-[18px] tracking-[-0.015em] text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  {e.decedentName || <em className="text-[var(--mute)]">Unnamed estate</em>}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  Role: {e.role}
                </p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
