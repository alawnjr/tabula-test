import type { FormData } from "@/state/case-store";
import type {
  Field,
  FormSchema,
  RepeatingGroup,
  Section,
  SectionItem,
} from "./schemas/types";
import { isRepeatingGroup } from "./schemas/types";

export type SectionCompletion = {
  filled: number;
  total: number;
  requiredMissing: number;
};

export type FormCompletion = SectionCompletion & {
  derived: boolean;
  sections: Record<string, SectionCompletion>;
  empty: boolean;
  complete: boolean;
};

function isFilled(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  if (typeof v === "boolean") return true;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function isFieldVisible(
  field: Field,
  scope: Record<string, unknown>
): boolean {
  if (!field.visibleIf) return true;
  return scope[field.visibleIf.fieldId] === field.visibleIf.equals;
}

function countField(
  field: Field,
  scope: Record<string, unknown>
): SectionCompletion {
  // The "address" placeholder type renders no control directly — its real
  // sub-fields are flattened upstream by addressFields(). Skip to avoid
  // counting the wrapper.
  if (field.type === "address") {
    return { filled: 0, total: 0, requiredMissing: 0 };
  }
  if (!isFieldVisible(field, scope)) {
    return { filled: 0, total: 0, requiredMissing: 0 };
  }
  const filled = isFilled(scope[field.id]) ? 1 : 0;
  const requiredMissing = field.required && !filled ? 1 : 0;
  return { filled, total: 1, requiredMissing };
}

function countRepeatingGroup(
  group: RepeatingGroup,
  parentScope: Record<string, unknown>
): SectionCompletion {
  const items = Array.isArray(parentScope[group.id])
    ? (parentScope[group.id] as Record<string, unknown>[])
    : [];
  let filled = 0;
  let total = 0;
  let requiredMissing = 0;
  for (const item of items) {
    for (const f of group.fields) {
      const c = countField(f, item ?? {});
      filled += c.filled;
      total += c.total;
      requiredMissing += c.requiredMissing;
    }
  }
  return { filled, total, requiredMissing };
}

function countItem(
  item: SectionItem,
  scope: Record<string, unknown>
): SectionCompletion {
  if (isRepeatingGroup(item)) return countRepeatingGroup(item, scope);
  return countField(item, scope);
}

export function computeSectionCompletion(
  section: Section,
  formData: FormData | undefined
): SectionCompletion {
  const scope = (formData ?? {}) as Record<string, unknown>;
  let filled = 0;
  let total = 0;
  let requiredMissing = 0;
  for (const item of section.items) {
    const c = countItem(item, scope);
    filled += c.filled;
    total += c.total;
    requiredMissing += c.requiredMissing;
  }
  return { filled, total, requiredMissing };
}

export function computeFormCompletion(
  schema: FormSchema,
  formData: FormData | undefined
): FormCompletion {
  if (schema.derived) {
    return {
      filled: 0,
      total: 0,
      requiredMissing: 0,
      sections: {},
      derived: true,
      empty: true,
      complete: false,
    };
  }
  const sections: Record<string, SectionCompletion> = {};
  let filled = 0;
  let total = 0;
  let requiredMissing = 0;
  for (const s of schema.sections) {
    const c = computeSectionCompletion(s, formData);
    sections[s.id] = c;
    filled += c.filled;
    total += c.total;
    requiredMissing += c.requiredMissing;
  }
  return {
    filled,
    total,
    requiredMissing,
    sections,
    derived: false,
    empty: filled === 0,
    complete: total > 0 && filled === total,
  };
}
