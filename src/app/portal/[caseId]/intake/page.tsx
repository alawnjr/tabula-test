"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useCaseStore } from "@/state/case-store";
import { getSchema } from "@/lib/schemas";
import { SectionRenderer } from "@/components/form-renderer/SectionRenderer";
import { Button } from "@/components/ui/button";
import type { ChapterId } from "@/lib/schemas/types";

// Sections of Form 101 that the debtor fills in (personal info only)
const DEBTOR_SECTIONS = ["debtor1", "residence"];

export default function PortalIntakePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const raw = useQuery(api.cases.get, { id: caseId as Id<"cases"> });
  const updateAsDebtor = useMutation(api.cases.updateAsDebtor);

  const loadCase = useCaseStore((s) => s.loadCase);
  const setActive = useCaseStore((s) => s.setActiveCase);
  const loaded = useCaseStore((s) => Boolean(s.cases[caseId]));

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hydrate the case into Zustand so field components can read/write it
  useEffect(() => {
    if (raw) {
      const data = (raw.data ?? {}) as Record<string, unknown>;
      loadCase({
        id: raw._id,
        chapter: raw.chapter as ChapterId,
        debtorName: raw.debtorName,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        forms: (data.forms as any) ?? {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bankData: data.bankData as any,
      });
      setActive(caseId);
    }
  }, [raw, loadCase, setActive, caseId]);

  if (!raw || !loaded) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
        Loading…
      </p>
    );
  }

  const schema = getSchema("101");
  if (!schema) return null;
  const sections = schema.sections.filter((s) => DEBTOR_SECTIONS.includes(s.id));

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const form101 = useCaseStore.getState().cases[caseId]?.forms["101"] ?? {};
      await updateAsDebtor({
        id: caseId as Id<"cases">,
        form101Data: form101,
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

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
          Personal information
        </h1>
        <p className="text-[13px] text-[var(--ink-2)]">
          Fill in your name and address. Your attorney will review this information before finalizing your petition.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            formId="101"
          />
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved && (
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--accent-deep)]">
            Saved ✓
          </p>
        )}
      </div>
    </div>
  );
}
