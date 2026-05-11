"use client";

import { Sparkles } from "lucide-react";
import {
  useCaseStore,
  getAutofillMark,
  getValueAtPath,
  type AutofillMark,
  type FieldValue,
} from "@/state/case-store";
import type { Field } from "@/lib/schemas/types";
import { Label } from "@/components/ui/label";
import { TextField } from "./fields/TextField";
import { TextAreaField } from "./fields/TextAreaField";
import { CurrencyField } from "./fields/CurrencyField";
import { NumberField } from "./fields/NumberField";
import { DateField } from "./fields/DateField";
import { SelectField } from "./fields/SelectField";
import { RadioField } from "./fields/RadioField";
import { CheckboxField } from "./fields/CheckboxField";

type Props = {
  field: Field;
  formId: string;
  parentPath: string[];
  scopeData?: Record<string, unknown>;
};

export function FieldRenderer({ field, formId, parentPath, scopeData }: Props) {
  const path = [...parentPath, field.id];
  const setFieldValue = useCaseStore((s) => s.setFieldValue);

  const value = useCaseStore((s) => {
    const c = s.activeCaseId ? s.cases[s.activeCaseId] : null;
    if (!c) return undefined;
    return getValueAtPath(c.forms[formId], path);
  });

  const autofillMark = useCaseStore((s) => {
    const c = s.activeCaseId ? s.cases[s.activeCaseId] : null;
    return getAutofillMark(c ?? undefined, formId, path);
  });

  const sibling = useCaseStore((s) => {
    if (!field.visibleIf) return undefined;
    if (scopeData && scopeData[field.visibleIf.fieldId] !== undefined) {
      return scopeData[field.visibleIf.fieldId];
    }
    const c = s.activeCaseId ? s.cases[s.activeCaseId] : null;
    if (!c) return undefined;
    return getValueAtPath(c.forms[formId], [
      ...parentPath,
      field.visibleIf.fieldId,
    ]);
  });

  if (field.visibleIf && sibling !== field.visibleIf.equals) return null;

  const inputId = `${formId}-${path.join("-")}`;
  const set = (v: FieldValue) => setFieldValue(formId, path, v);

  let control: React.ReactNode = null;
  switch (field.type) {
    case "text":
      control = (
        <TextField
          id={inputId}
          value={(value as string) ?? ""}
          onChange={set}
          placeholder={field.placeholder}
        />
      );
      break;
    case "textarea":
      control = (
        <TextAreaField
          id={inputId}
          value={(value as string) ?? ""}
          onChange={set}
          placeholder={field.placeholder}
        />
      );
      break;
    case "currency":
      control = (
        <CurrencyField
          id={inputId}
          value={value as number | string | undefined}
          onChange={set}
        />
      );
      break;
    case "number":
      control = (
        <NumberField
          id={inputId}
          value={value as number | string | undefined}
          onChange={(v) => set(v === "" ? undefined : v)}
          placeholder={field.placeholder}
        />
      );
      break;
    case "date":
      control = (
        <DateField id={inputId} value={value as string | undefined} onChange={set} />
      );
      break;
    case "select":
      control = (
        <SelectField
          id={inputId}
          value={value as string | undefined}
          onChange={set}
          options={field.options ?? []}
        />
      );
      break;
    case "radio":
      control = (
        <RadioField
          id={inputId}
          value={value as string | undefined}
          onChange={set}
          options={field.options ?? []}
        />
      );
      break;
    case "checkbox":
      return (
        <div className="space-y-1">
          <div className="inline-flex items-center">
            <CheckboxField
              id={inputId}
              value={value as boolean | undefined}
              onChange={set}
              label={field.label}
            />
            <AutofillDot mark={autofillMark} />
          </div>
          {field.help ? (
            <p className="ml-6 text-xs text-muted-foreground">{field.help}</p>
          ) : null}
        </div>
      );
    case "address":
      control = null;
      break;
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>
        {field.label}
        {field.required ? (
          <span className="ml-0.5 text-destructive">*</span>
        ) : null}
        <AutofillDot mark={autofillMark} />
      </Label>
      {control}
      {field.help ? (
        <p className="text-xs text-muted-foreground">{field.help}</p>
      ) : null}
    </div>
  );
}

function AutofillDot({ mark }: { mark: AutofillMark | undefined }) {
  if (!mark) return null;
  const verb =
    mark.source === "teller"
      ? "Pulled from"
      : mark.source === "upload"
      ? "Auto-filled from"
      : "From";
  const title = `${verb} ${mark.sourceLabel} · ${new Date(
    mark.appliedAt
  ).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
  return (
    <span
      title={title}
      aria-label={title}
      className="ml-1 inline-flex -translate-y-[1px] align-middle text-[var(--accent-deep)] motion-safe:animate-pulse"
    >
      <Sparkles aria-hidden className="h-2.5 w-2.5" />
    </span>
  );
}
