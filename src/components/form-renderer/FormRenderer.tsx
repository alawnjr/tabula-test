"use client";

import { useEffect, useMemo, useState } from "react";
import { getSchema } from "@/lib/schemas";
import {
  computeSectionCompletion,
  type SectionCompletion,
} from "@/lib/completion";
import { useCaseStore } from "@/state/case-store";
import { cn } from "@/lib/utils";
import { SectionRenderer } from "./SectionRenderer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function FormRenderer({
  formId,
  footer,
}: {
  formId: string;
  footer?: React.ReactNode;
}) {
  const schema = getSchema(formId);
  const initial = schema?.sections[0]?.id ?? "";
  const [active, setActive] = useState(initial);

  // Subscribe to this form's data so per-section indicators update as the
  // user types. We deliberately scope to a single form to keep re-renders
  // tight.
  const formData = useCaseStore((s) => {
    const id = s.activeCaseId;
    if (!id) return undefined;
    return s.cases[id]?.forms[formId];
  });

  const sectionCompletion = useMemo(() => {
    const out: Record<string, SectionCompletion> = {};
    if (!schema) return out;
    for (const sec of schema.sections) {
      out[sec.id] = computeSectionCompletion(sec, formData);
    }
    return out;
  }, [schema, formData]);

  // Reset to first section + scroll to top when navigating between forms.
  useEffect(() => {
    setActive(schema?.sections[0]?.id ?? "");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [formId, schema]);

  // Scroll to top when the active section changes too.
  useEffect(() => {
    if (typeof window !== "undefined" && active) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [active]);

  if (!schema) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
        <p className="text-[13px] text-[var(--mute)]">
          No schema registered for form &quot;{formId}&quot;.
        </p>
      </div>
    );
  }

  const sections = schema.sections;
  const single = sections.length <= 1;
  const activeIdx = Math.max(
    0,
    sections.findIndex((s) => s.id === active)
  );

  if (single) {
    const only = sections[0];
    return (
      <div>
        <FormTopBar schema={schema} />
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-14 lg:px-8 lg:pt-12 space-y-6">
          {only ? (
            <>
              <header className="space-y-1.5">
                <h2
                  className="text-[22px] leading-[1.15] tracking-[-0.02em] text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  {only.title}
                </h2>
                {only.description ? (
                  <p className="max-w-[68ch] text-[13px] leading-[1.55] text-[var(--ink-2)]">
                    {only.description}
                  </p>
                ) : null}
              </header>
              <SectionRenderer section={only} formId={schema.id} unwrapped />
            </>
          ) : null}
          {footer ? (
            <div className="mt-8 border-t border-[var(--rule)] pt-4">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Tabs value={active} onValueChange={setActive}>
      {/* Sticky full-width form bar: title row + tab list */}
      <div
        className="sticky z-20 border-b border-[var(--rule)] bg-[var(--paper)]"
        style={{ top: "var(--case-header-h)" }}
      >
        <div className="flex items-center justify-between gap-4 px-4 pt-3 pb-2 lg:px-8">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] shrink-0">
              Form {schema.id}
            </span>
            <h1
              className="text-[18px] tracking-[-0.015em] text-[var(--ink)] truncate"
              style={{ fontFamily: "var(--serif)" }}
            >
              {schema.title}
            </h1>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] tabular-nums shrink-0">
            {String(activeIdx + 1).padStart(2, "0")} /{" "}
            {String(sections.length).padStart(2, "0")}
          </span>
        </div>

        <TabsList className="px-2 lg:px-6">
          {sections.map((s, i) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              index={i}
              indicator={
                <SectionDot completion={sectionCompletion[s.id]} />
              }
            >
              {s.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Constrained content */}
      <div className="mx-auto max-w-3xl px-4 pt-10 pb-14 lg:px-8 lg:pt-12">
        {sections.map((s, i) => (
          <TabsContent key={s.id} value={s.id} className="space-y-6">
            <header className="space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] flex items-center gap-2">
                <span>
                  Section {String(i + 1).padStart(2, "0")} of{" "}
                  {String(sections.length).padStart(2, "0")}
                </span>
                <SectionEyebrowStatus
                  completion={sectionCompletion[s.id]}
                />
              </span>
              <h2
                className="text-[22px] leading-[1.15] tracking-[-0.02em] text-[var(--ink)]"
                style={{ fontFamily: "var(--serif)" }}
              >
                {s.title}
              </h2>
              {s.description ? (
                <p className="max-w-[68ch] text-[13px] leading-[1.55] text-[var(--ink-2)]">
                  {s.description}
                </p>
              ) : null}
            </header>

            <SectionRenderer section={s} formId={schema.id} unwrapped />

            <div className="flex items-center justify-between border-t border-[var(--rule-soft)] pt-4">
              <button
                type="button"
                onClick={
                  i > 0 ? () => setActive(sections[i - 1].id) : undefined
                }
                disabled={i === 0}
                className="group inline-flex items-center gap-2 text-[11px] tracking-[-0.01em] text-[var(--mute)] transition-colors hover:text-[var(--ink)] disabled:invisible"
              >
                <span className="font-mono uppercase tracking-[0.12em]">
                  ← Prev
                </span>
                <span style={{ fontFamily: "var(--serif)" }}>
                  {sections[i - 1]?.title}
                </span>
              </button>
              <button
                type="button"
                onClick={
                  i < sections.length - 1
                    ? () => setActive(sections[i + 1].id)
                    : undefined
                }
                disabled={i === sections.length - 1}
                className="group inline-flex items-center gap-2 text-[11px] tracking-[-0.01em] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)] disabled:invisible"
              >
                <span style={{ fontFamily: "var(--serif)" }}>
                  {sections[i + 1]?.title}
                </span>
                <span className="font-mono uppercase tracking-[0.12em]">
                  Next →
                </span>
              </button>
            </div>
          </TabsContent>
        ))}

        {footer ? (
          <div className="mt-6 border-t border-[var(--rule)] pt-4">
            {footer}
          </div>
        ) : null}
      </div>
    </Tabs>
  );
}

function FormTopBar({
  schema,
}: {
  schema: { id: string; title: string; longTitle?: string };
}) {
  return (
    <div
      className="sticky z-20 border-b border-[var(--rule)] bg-[var(--paper)]"
      style={{ top: "var(--case-header-h)" }}
    >
      <div className="flex items-baseline justify-between gap-4 px-4 py-3 lg:px-8">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] shrink-0">
            Form {schema.id}
          </span>
          <h1
            className="text-[18px] tracking-[-0.015em] text-[var(--ink)] truncate"
            style={{ fontFamily: "var(--serif)" }}
          >
            {schema.title}
          </h1>
        </div>
      </div>
    </div>
  );
}

function SectionDot({ completion }: { completion?: SectionCompletion }) {
  if (!completion || completion.total === 0) return null;
  const { filled, total, requiredMissing } = completion;
  const complete = filled === total;
  const tone = requiredMissing > 0
    ? "danger"
    : complete
    ? "complete"
    : filled === 0
    ? "empty"
    : "partial";
  const title =
    requiredMissing > 0
      ? `${requiredMissing} required missing · ${filled} of ${total} filled`
      : complete
      ? `All ${total} fields filled`
      : `${filled} of ${total} filled`;
  return (
    <span
      aria-label={title}
      title={title}
      className={cn(
        "inline-flex items-center justify-center font-mono text-[8.5px] tracking-[0.05em] tabular-nums",
        tone === "danger" && "text-[var(--destructive)]",
        tone === "complete" && "text-[var(--accent-deep)]",
        tone === "empty" && "text-[var(--mute)]",
        tone === "partial" && "text-[var(--ink-2)]"
      )}
    >
      {tone === "complete" ? (
        <span className="text-[10px] leading-none">✓</span>
      ) : tone === "empty" ? (
        <span
          aria-hidden
          className="block h-1.5 w-1.5 rounded-full border border-current"
        />
      ) : (
        <span>
          {filled}
          <span className="opacity-50">/{total}</span>
        </span>
      )}
    </span>
  );
}

function SectionEyebrowStatus({
  completion,
}: {
  completion?: SectionCompletion;
}) {
  if (!completion || completion.total === 0) return null;
  const { filled, total, requiredMissing } = completion;
  const complete = filled === total;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 tabular-nums",
        requiredMissing > 0
          ? "text-[var(--destructive)]"
          : complete
          ? "text-[var(--accent-deep)]"
          : "text-[var(--ink-2)]"
      )}
    >
      <span aria-hidden>·</span>
      <span>
        {complete
          ? `Complete · ${total} fields`
          : `${filled} of ${total} filled`}
      </span>
      {requiredMissing > 0 ? (
        <span title={`${requiredMissing} required missing`}>
          · {requiredMissing} required missing
        </span>
      ) : null}
    </span>
  );
}
