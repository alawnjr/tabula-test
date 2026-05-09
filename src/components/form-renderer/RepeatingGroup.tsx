"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCaseStore } from "@/state/case-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { RepeatingGroup as RepeatingGroupSchema } from "@/lib/schemas/types";
import { FieldRenderer } from "./FieldRenderer";

const EMPTY: unknown[] = [];

export function RepeatingGroup({
  group,
  formId,
  parentPath = [],
}: {
  group: RepeatingGroupSchema;
  formId: string;
  parentPath?: string[];
}) {
  const append = useCaseStore((s) => s.appendRepeatingItem);
  const remove = useCaseStore((s) => s.removeRepeatingItem);
  const items = useCaseStore((s) => {
    const c = s.activeCaseId ? s.cases[s.activeCaseId] : null;
    if (!c) return EMPTY;
    const path = [...parentPath, group.id];
    let cur: unknown = c.forms[formId];
    for (const k of path) {
      if (cur && typeof cur === "object") {
        cur = (cur as Record<string, unknown>)[k];
      } else {
        cur = undefined;
      }
    }
    return Array.isArray(cur) ? cur : EMPTY;
  });

  return (
    <section className="space-y-3 rounded-[3px] border border-dashed border-[var(--rule)] bg-[var(--paper)] p-3">
      <header className="flex flex-col gap-0.5">
        <h3
          className="text-[14px] tracking-[-0.01em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          {group.label}
        </h3>
        {group.description ? (
          <p className="text-[11px] text-[var(--mute)]">{group.description}</p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <p
          className="text-[12px] italic text-[var(--mute)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          No {group.itemLabel.toLowerCase()}s yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => {
            const itemPath = [...parentPath, group.id, String(index)];
            return (
              <li
                key={index}
                className="space-y-2 rounded-[2px] border border-[var(--rule-soft)] bg-[var(--paper-2)] p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                    {group.itemLabel} № {String(index + 1).padStart(2, "0")}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(formId, group.id, index)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </Button>
                </div>
                <Separator />
                <div className="grid gap-3 md:grid-cols-2">
                  {group.fields.map((f) => (
                    <FieldRenderer
                      key={f.id}
                      field={f}
                      formId={formId}
                      parentPath={itemPath}
                      scopeData={(item ?? {}) as Record<string, unknown>}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(formId, group.id)}
      >
        <Plus className="h-3 w-3" />
        Add {group.itemLabel.toLowerCase()}
      </Button>
    </section>
  );
}
