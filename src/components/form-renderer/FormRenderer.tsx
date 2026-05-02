"use client";

import { getSchema } from "@/lib/schemas";
import { SectionRenderer } from "./SectionRenderer";

export function FormRenderer({ formId }: { formId: string }) {
  const schema = getSchema(formId);
  if (!schema) {
    return (
      <p className="text-sm text-muted-foreground">
        No schema registered for form &quot;{formId}&quot;.
      </p>
    );
  }
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Form {schema.id}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {schema.title}
        </h1>
        <p className="text-sm text-muted-foreground">{schema.longTitle}</p>
      </header>
      <div className="space-y-6">
        {schema.sections.map((s) => (
          <SectionRenderer key={s.id} section={s} formId={schema.id} />
        ))}
      </div>
    </div>
  );
}
