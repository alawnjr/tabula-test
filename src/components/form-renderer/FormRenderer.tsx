"use client";

import { useEffect, useState } from "react";
import { getSchema } from "@/lib/schemas";
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
            <TabsTrigger key={s.id} value={s.id} index={i}>
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
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
                Section {String(i + 1).padStart(2, "0")} of{" "}
                {String(sections.length).padStart(2, "0")}
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
