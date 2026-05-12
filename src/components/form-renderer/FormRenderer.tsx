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

// FormTopBar is sticky at --case-header-h. The sidebar must stick below it.
const FORM_TOPBAR_H = "3.25rem";

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

  useEffect(() => {
    setActive(schema?.sections[0]?.id ?? "");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [formId, schema]);

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
  const multi = sections.length > 1;
  const activeIdx = Math.max(
    0,
    sections.findIndex((s) => s.id === active)
  );
  const activeSection = sections[activeIdx];

  return (
    <div style={{ "--form-topbar-h": FORM_TOPBAR_H } as React.CSSProperties}>
      <FormTopBar schema={schema} sectionCount={sections.length} activeIdx={activeIdx} />

      <div className="flex">
        {/* Section nav sidebar — always rendered so section 01 is always reachable */}
        <nav
          className="hidden w-56 shrink-0 lg:block"
          style={{
            position: "sticky",
            top: "calc(var(--case-header-h) + var(--form-topbar-h))",
            alignSelf: "flex-start",
            maxHeight: "calc(100vh - var(--case-header-h) - var(--form-topbar-h))",
            overflowY: "auto",
          }}
        >
          <ul className="space-y-0.5 py-6 pl-4 pr-2">
            {sections.map((s, i) => {
              const isActive = s.id === active;
              const comp = sectionCompletion[s.id];
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActive(s.id)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-[3px] px-2 py-1.5 text-left transition-colors",
                      isActive
                        ? "bg-[var(--paper-3)] text-[var(--ink)]"
                        : "text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
                    )}
                  >
                    <span className="mt-px shrink-0 font-mono text-[8.5px] tracking-[0.1em] text-[var(--mute)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className="block text-[12px] leading-snug tracking-[-0.01em]"
                        style={{ fontFamily: "var(--serif)" }}
                      >
                        {s.title}
                      </span>
                    </span>
                    <span className="mt-1 shrink-0">
                      <SectionDot completion={comp} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Section content */}
        <div className="flex-1 min-w-0">
          <div className="mx-auto max-w-3xl px-4 pt-14 pb-14 lg:px-8 lg:pt-16 space-y-6">
            {activeSection ? (
              <>
                <header className="space-y-1.5">
                  {multi ? (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] flex items-center gap-2">
                      <span>
                        Section {String(activeIdx + 1).padStart(2, "0")} of{" "}
                        {String(sections.length).padStart(2, "0")}
                      </span>
                      <SectionEyebrowStatus
                        completion={sectionCompletion[activeSection.id]}
                      />
                    </span>
                  ) : null}
                  <h2
                    className="text-[22px] leading-[1.15] tracking-[-0.02em] text-[var(--ink)]"
                    style={{ fontFamily: "var(--serif)" }}
                  >
                    {activeSection.title}
                  </h2>
                  {activeSection.description ? (
                    <p className="max-w-[68ch] text-[13px] leading-[1.55] text-[var(--ink-2)]">
                      {activeSection.description}
                    </p>
                  ) : null}
                </header>

                <SectionRenderer section={activeSection} formId={schema.id} unwrapped />

                {multi ? (
                  <div className="flex items-center justify-between border-t border-[var(--rule-soft)] pt-4">
                    <button
                      type="button"
                      onClick={
                        activeIdx > 0
                          ? () => setActive(sections[activeIdx - 1].id)
                          : undefined
                      }
                      disabled={activeIdx === 0}
                      className="group inline-flex items-center gap-2 text-[11px] tracking-[-0.01em] text-[var(--mute)] transition-colors hover:text-[var(--ink)] disabled:invisible"
                    >
                      <span className="font-mono uppercase tracking-[0.12em]">
                        ← Prev
                      </span>
                      <span style={{ fontFamily: "var(--serif)" }}>
                        {sections[activeIdx - 1]?.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={
                        activeIdx < sections.length - 1
                          ? () => setActive(sections[activeIdx + 1].id)
                          : undefined
                      }
                      disabled={activeIdx === sections.length - 1}
                      className="group inline-flex items-center gap-2 text-[11px] tracking-[-0.01em] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)] disabled:invisible"
                    >
                      <span style={{ fontFamily: "var(--serif)" }}>
                        {sections[activeIdx + 1]?.title}
                      </span>
                      <span className="font-mono uppercase tracking-[0.12em]">
                        Next →
                      </span>
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}

            {footer ? (
              <div className="mt-6 border-t border-[var(--rule)] pt-4">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormTopBar({
  schema,
  sectionCount,
  activeIdx,
}: {
  schema: { id: string; title: string; longTitle?: string };
  sectionCount?: number;
  activeIdx?: number;
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
        {sectionCount != null && sectionCount > 1 && activeIdx != null ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] tabular-nums shrink-0">
            {String(activeIdx + 1).padStart(2, "0")} /{" "}
            {String(sectionCount).padStart(2, "0")}
          </span>
        ) : null}
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
