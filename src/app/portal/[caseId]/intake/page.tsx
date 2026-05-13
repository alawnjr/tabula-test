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

function intakeConfig(chapter: ChapterId): {
  formId: string;
  sectionIds: string[];
  title: string;
  description: string;
} {
  if (chapter === "personalInjury") {
    return {
      formId: "pi-intake",
      sectionIds: ["client", "incident"],
      title: "Your information",
      description:
        "Fill in your personal details and describe the incident. Your attorney will review this before proceeding.",
    };
  }
  // Bankruptcy (chapter7, chapter13, meansTest)
  return {
    formId: "101",
    sectionIds: ["debtor1", "residence"],
    title: "Personal information",
    description:
      "Fill in your name and address. Your attorney will review this information before finalizing your petition.",
  };
}

export default function PortalIntakePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const raw = useQuery(api.cases.get, { id: caseId as Id<"cases"> });
  const updateAsDebtor = useMutation(api.cases.updateAsDebtor);
  const updateAsClient = useMutation(api.cases.updateAsClient);

  const loadCase = useCaseStore((s) => s.loadCase);
  const setActive = useCaseStore((s) => s.setActiveCase);
  const loaded = useCaseStore((s) => Boolean(s.cases[caseId]));

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const chapter = raw.chapter as ChapterId;
  const config = intakeConfig(chapter);
  const schema = getSchema(config.formId);
  if (!schema) return null;
  const sections = schema.sections.filter((s) =>
    config.sectionIds.includes(s.id)
  );

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const formData =
        useCaseStore.getState().cases[caseId]?.forms[config.formId] ?? {};
      const now = new Date().toISOString();
      if (chapter === "chapter7" || chapter === "chapter13" || chapter === "meansTest") {
        await updateAsDebtor({
          id: caseId as Id<"cases">,
          form101Data: formData,
          updatedAt: now,
        });
      } else {
        await updateAsClient({
          id: caseId as Id<"cases">,
          formId: config.formId,
          formData,
          updatedAt: now,
        });
      }
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
          {config.title}
        </h1>
        <p className="text-[13px] text-[var(--ink-2)]">{config.description}</p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            formId={config.formId}
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
