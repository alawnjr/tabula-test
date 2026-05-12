"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { chapterLabel } from "@/lib/schemas";
import { computeFormCompletion } from "@/lib/completion";
import { FORM_ORDER, getSchema } from "@/lib/schemas";
import type { ChapterId } from "@/lib/schemas/types";

export default function PortalDashboard() {
  const cases = useQuery(api.cases.listAsDebtor);
  const me = useQuery(api.cases.whoAmI);

  if (cases === undefined) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
        Loading…
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <span className="pill">
          <span className="dot" />
          Client Portal
        </span>
        <h1
          className="text-[28px] tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          Your case
        </h1>
        <p className="text-[13px] text-[var(--ink-2)]">
          Below are the bankruptcy cases your attorney has shared with you.
        </p>
        {me && (
          <p className="font-mono text-[10px] text-[var(--mute)]">
            Signed in as: {me.email ?? "(no email in token)"}
          </p>
        )}
      </div>

      {cases.length === 0 ? (
        <div className="rounded-[3px] border border-dashed border-[var(--rule)] bg-[var(--paper-2)] px-6 py-10 text-center">
          <p
            className="text-[16px] tracking-[-0.01em] text-[var(--ink-2)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            <em>No cases shared yet.</em>
          </p>
          <p className="mt-1.5 text-[12px] text-[var(--mute)]">
            Your attorney will share your case once it has been created. Make sure
            you&apos;re signed in with the email they have on file.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--rule-soft)] border-y border-[var(--rule-soft)]">
          {cases.map((c) => {
            const ids = FORM_ORDER[c.chapter as ChapterId] ?? [];
            const { filled, total } = ids.reduce(
              (acc, id) => {
                const schema = getSchema(id);
                if (!schema || schema.derived) return acc;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const comp = computeFormCompletion(schema, (c.data as any)?.forms?.[id]);
                return { filled: acc.filled + comp.filled, total: acc.total + comp.total };
              },
              { filled: 0, total: 0 }
            );
            const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

            return (
              <li key={c._id}>
                <Link
                  href={`/portal/${c._id}`}
                  className="group flex items-center justify-between gap-6 px-1 py-5 transition-colors hover:bg-[var(--paper-2)]"
                >
                  <div className="min-w-0 space-y-1">
                    <p
                      className="text-[18px] tracking-[-0.015em] text-[var(--ink)] group-hover:text-[var(--accent-deep)]"
                      style={{ fontFamily: "var(--serif)" }}
                    >
                      {c.debtorName || <em className="text-[var(--mute)]">Unnamed debtor</em>}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{chapterLabel(c.chapter as ChapterId)}</Badge>
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
                        {pct}% complete
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)] group-hover:text-[var(--ink)]">
                    Open →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
