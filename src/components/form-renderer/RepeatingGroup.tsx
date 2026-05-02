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
    <section className="space-y-3 rounded-md border border-dashed border-border p-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{group.label}</h3>
        {group.description ? (
          <p className="text-xs text-muted-foreground">{group.description}</p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No {group.itemLabel.toLowerCase()}s yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item, index) => {
            const itemPath = [...parentPath, group.id, String(index)];
            return (
              <li
                key={index}
                className="space-y-3 rounded-md bg-muted/40 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.itemLabel} #{index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(formId, group.id, index)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
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
        <Plus className="h-4 w-4" />
        Add {group.itemLabel.toLowerCase()}
      </Button>
    </section>
  );
}
