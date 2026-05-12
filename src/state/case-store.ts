"use client";

import { create } from "zustand";
import type { ChapterId } from "@/lib/schemas/types";
import type { ExtractedDoc, ExtractionSource } from "@/lib/integrations/types";

export type FieldValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>
  | unknown[];

export type FormData = Record<string, FieldValue>;

// Persisted bank-pull payload — saved verbatim so the user can re-run the
// import without re-authenticating with Teller.
export type PersistedBankData = {
  doc: ExtractedDoc;
  savedAt: string;
};

// Provenance for a field that was populated via the review/intake flow.
// Cleared on the next manual edit so the indicator only sticks while the
// user hasn't touched it.
export type AutofillMark = {
  source: ExtractionSource;
  sourceLabel: string;
  appliedAt: string;
};

// Per-form map keyed by joined field path. Path components are field IDs or
// numeric indices, neither of which contains "/".
type FormAutofill = Record<string, AutofillMark>;

export type CaseRecord = {
  id: string;
  chapter: ChapterId;
  debtorName: string;
  createdAt: string;
  updatedAt: string;
  forms: Record<string, FormData>;
  bankData?: PersistedBankData;
  autofilled?: Record<string, FormAutofill>;
};

type CaseStore = {
  cases: Record<string, CaseRecord>;
  activeCaseId: string | null;
  isLoaded: boolean;

  loadCase: (record: CaseRecord) => void;
  setCases: (records: CaseRecord[]) => void;
  setLoaded: () => void;

  createCase: (chapter: ChapterId) => string;
  setActiveCase: (id: string | null) => void;
  deleteCase: (id: string) => void;

  setFieldValue: (formId: string, path: string[], value: FieldValue) => void;
  appendRepeatingItem: (formId: string, groupId: string) => void;
  removeRepeatingItem: (formId: string, groupId: string, index: number) => void;

  markAutofilled: (formId: string, path: string[], mark: AutofillMark) => void;
  clearAutofillMark: (formId: string, path: string[]) => void;

  setBankData: (caseId: string, doc: ExtractedDoc) => void;
  clearBankData: (caseId: string) => void;

  // Branch a means-test (or any) case into a fresh case under a new chapter,
  // copying forms + bank data so the user keeps their work. Returns new id.
  branchToChapter: (sourceCaseId: string, chapter: ChapterId) => string | null;

  exportCase: (id: string) => string;
  importCase: (json: string) => string;
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function nowIso() {
  return new Date().toISOString();
}

function setDeep(
  root: Record<string, unknown>,
  path: string[],
  value: FieldValue
): Record<string, unknown> {
  if (path.length === 0) return root;
  const [head, ...rest] = path;
  const next = { ...root };
  if (rest.length === 0) {
    next[head] = value as unknown;
    return next;
  }
  const childKey = rest[0];
  const isArrayChild = /^\d+$/.test(childKey);
  const existing = next[head];
  const childContainer: Record<string, unknown> | unknown[] = isArrayChild
    ? Array.isArray(existing)
      ? [...existing]
      : []
    : existing && typeof existing === "object" && !Array.isArray(existing)
    ? { ...(existing as Record<string, unknown>) }
    : {};
  next[head] = setDeep(
    childContainer as Record<string, unknown>,
    rest,
    value
  );
  return next;
}

function pathKey(path: string[]): string {
  return path.join("/");
}

function withFormAutofill(
  autofilled: Record<string, FormAutofill> | undefined,
  formId: string,
  next: FormAutofill
): Record<string, FormAutofill> {
  const out = { ...(autofilled ?? {}) };
  if (Object.keys(next).length === 0) {
    delete out[formId];
  } else {
    out[formId] = next;
  }
  return out;
}

function clearAutofillAt(
  autofilled: Record<string, FormAutofill> | undefined,
  formId: string,
  path: string[]
): Record<string, FormAutofill> | undefined {
  const formMarks = autofilled?.[formId];
  if (!formMarks) return autofilled;
  const key = pathKey(path);
  if (!(key in formMarks)) return autofilled;
  const next = { ...formMarks };
  delete next[key];
  return withFormAutofill(autofilled, formId, next);
}

// When a repeating-group item is removed, drop marks at that index and
// shift higher-index marks down by one so they stay attached to the right row.
function shiftAutofillOnRemove(
  autofilled: Record<string, FormAutofill> | undefined,
  formId: string,
  groupId: string,
  removedIndex: number
): Record<string, FormAutofill> | undefined {
  const formMarks = autofilled?.[formId];
  if (!formMarks) return autofilled;
  let changed = false;
  const next: FormAutofill = {};
  for (const [key, mark] of Object.entries(formMarks)) {
    const parts = key.split("/");
    if (parts[0] !== groupId) {
      next[key] = mark;
      continue;
    }
    const idx = Number(parts[1]);
    if (!Number.isFinite(idx)) {
      next[key] = mark;
      continue;
    }
    if (idx === removedIndex) {
      changed = true;
      continue;
    }
    if (idx > removedIndex) {
      parts[1] = String(idx - 1);
      next[parts.join("/")] = mark;
      changed = true;
    } else {
      next[key] = mark;
    }
  }
  if (!changed) return autofilled;
  return withFormAutofill(autofilled, formId, next);
}

function deriveDebtorName(forms: Record<string, FormData>): string {
  // Bankruptcy: name comes from Form 101
  const f101 = forms["101"];
  if (f101) {
    const parts = ["debtor1NameFirst", "debtor1NameMiddle", "debtor1NameLast"].map(
      (k) => (f101[k] as string | undefined) ?? ""
    );
    const joined = parts.filter(Boolean).join(" ").trim();
    if (joined) return joined;
  }
  // Personal injury / real estate: name comes from client intake forms
  for (const formId of ["pi-intake", "re-parties"]) {
    const f = forms[formId];
    if (f) {
      const parts = ["clientNameFirst", "clientNameMiddle", "clientNameLast"].map(
        (k) => (f[k] as string | undefined) ?? ""
      );
      const joined = parts.filter(Boolean).join(" ").trim();
      if (joined) return joined;
    }
  }
  return "";
}

export const useCaseStore = create<CaseStore>()((set, get) => ({
      cases: {},
      activeCaseId: null,
      isLoaded: false,

      loadCase: (record) =>
        set((s) => ({
          cases: { ...s.cases, [record.id]: record },
        })),

      setCases: (records) => {
        const cases: Record<string, CaseRecord> = {};
        for (const r of records) cases[r.id] = r;
        set({ cases, isLoaded: true });
      },

      setLoaded: () => set({ isLoaded: true }),

      createCase: (chapter) => {
        const id = uid();
        const now = nowIso();
        const forms: Record<string, FormData> =
          chapter === "meansTest"
            ? {}
            : { "101": { chapterChoice: chapter } };
        set((s) => ({
          cases: {
            ...s.cases,
            [id]: {
              id,
              chapter,
              debtorName: "",
              createdAt: now,
              updatedAt: now,
              forms,
            },
          },
          activeCaseId: id,
        }));
        return id;
      },

      setActiveCase: (id) => set({ activeCaseId: id }),

      deleteCase: (id) =>
        set((s) => {
          const next = { ...s.cases };
          delete next[id];
          return {
            cases: next,
            activeCaseId: s.activeCaseId === id ? null : s.activeCaseId,
          };
        }),

      setFieldValue: (formId, path, value) =>
        set((s) => {
          const id = s.activeCaseId;
          if (!id) return s;
          const c = s.cases[id];
          if (!c) return s;
          const formData = c.forms[formId] ?? {};
          const updatedForm = setDeep(
            formData as Record<string, unknown>,
            path,
            value
          ) as FormData;
          const newForms = { ...c.forms, [formId]: updatedForm };
          const debtorName =
            formId === "101" || formId === "pi-intake" || formId === "re-parties"
              ? deriveDebtorName(newForms)
              : c.debtorName;
          // A direct write clears the autofill mark; the review apply flow
          // re-marks the field afterwards via markAutofilled.
          const autofilled = clearAutofillAt(c.autofilled, formId, path);
          return {
            cases: {
              ...s.cases,
              [id]: {
                ...c,
                forms: newForms,
                debtorName,
                autofilled,
                updatedAt: nowIso(),
              },
            },
          };
        }),

      appendRepeatingItem: (formId, groupId) =>
        set((s) => {
          const id = s.activeCaseId;
          if (!id) return s;
          const c = s.cases[id];
          if (!c) return s;
          const formData = c.forms[formId] ?? {};
          const existing = Array.isArray(formData[groupId])
            ? (formData[groupId] as unknown[])
            : [];
          const newForms = {
            ...c.forms,
            [formId]: { ...formData, [groupId]: [...existing, {}] },
          };
          return {
            cases: {
              ...s.cases,
              [id]: { ...c, forms: newForms, updatedAt: nowIso() },
            },
          };
        }),

      removeRepeatingItem: (formId, groupId, index) =>
        set((s) => {
          const id = s.activeCaseId;
          if (!id) return s;
          const c = s.cases[id];
          if (!c) return s;
          const formData = c.forms[formId] ?? {};
          const existing = Array.isArray(formData[groupId])
            ? (formData[groupId] as unknown[])
            : [];
          const next = existing.filter((_, i) => i !== index);
          const newForms = {
            ...c.forms,
            [formId]: { ...formData, [groupId]: next },
          };
          const autofilled = shiftAutofillOnRemove(
            c.autofilled,
            formId,
            groupId,
            index
          );
          return {
            cases: {
              ...s.cases,
              [id]: { ...c, forms: newForms, autofilled, updatedAt: nowIso() },
            },
          };
        }),

      markAutofilled: (formId, path, mark) =>
        set((s) => {
          const id = s.activeCaseId;
          if (!id) return s;
          const c = s.cases[id];
          if (!c) return s;
          const formMarks: FormAutofill = {
            ...(c.autofilled?.[formId] ?? {}),
            [pathKey(path)]: mark,
          };
          const autofilled = withFormAutofill(c.autofilled, formId, formMarks);
          return {
            cases: {
              ...s.cases,
              [id]: { ...c, autofilled, updatedAt: nowIso() },
            },
          };
        }),

      clearAutofillMark: (formId, path) =>
        set((s) => {
          const id = s.activeCaseId;
          if (!id) return s;
          const c = s.cases[id];
          if (!c) return s;
          const autofilled = clearAutofillAt(c.autofilled, formId, path);
          if (autofilled === c.autofilled) return s;
          return {
            cases: { ...s.cases, [id]: { ...c, autofilled } },
          };
        }),

      setBankData: (caseId, doc) =>
        set((s) => {
          const c = s.cases[caseId];
          if (!c) return s;
          return {
            cases: {
              ...s.cases,
              [caseId]: {
                ...c,
                bankData: { doc, savedAt: nowIso() },
                updatedAt: nowIso(),
              },
            },
          };
        }),

      branchToChapter: (sourceCaseId, chapter) => {
        const src = get().cases[sourceCaseId];
        if (!src) return null;
        const id = uid();
        const now = nowIso();
        const forms: Record<string, FormData> = {};
        for (const [k, v] of Object.entries(src.forms)) {
          forms[k] = { ...v };
        }
        // Petition needs the chapter selection to match.
        const existing101 = forms["101"] ?? {};
        forms["101"] = { ...existing101, chapterChoice: chapter };
        set((s) => ({
          cases: {
            ...s.cases,
            [id]: {
              id,
              chapter,
              debtorName: src.debtorName,
              createdAt: now,
              updatedAt: now,
              forms,
              bankData: src.bankData,
              autofilled: src.autofilled
                ? Object.fromEntries(
                    Object.entries(src.autofilled).map(([k, v]) => [
                      k,
                      { ...v },
                    ])
                  )
                : undefined,
            },
          },
          activeCaseId: id,
        }));
        return id;
      },

      clearBankData: (caseId) =>
        set((s) => {
          const c = s.cases[caseId];
          if (!c) return s;
          const { bankData: _, ...rest } = c;
          void _;
          return {
            cases: { ...s.cases, [caseId]: { ...rest, updatedAt: nowIso() } },
          };
        }),

      exportCase: (id) => {
        const c = get().cases[id];
        if (!c) return "";
        return JSON.stringify(c, null, 2);
      },

      importCase: (json) => {
        const parsed = JSON.parse(json) as CaseRecord;
        const id = uid();
        const now = nowIso();
        const record: CaseRecord = {
          ...parsed,
          id,
          createdAt: parsed.createdAt ?? now,
          updatedAt: now,
          forms: parsed.forms ?? {},
        };
        set((s) => ({
          cases: { ...s.cases, [id]: record },
          activeCaseId: id,
        }));
        return id;
      },
    }));

export function getAutofillMark(
  c: CaseRecord | undefined,
  formId: string,
  path: string[]
): AutofillMark | undefined {
  return c?.autofilled?.[formId]?.[pathKey(path)];
}

export function getValueAtPath(
  data: FormData | undefined,
  path: string[]
): FieldValue {
  if (!data || path.length === 0) return undefined;
  let cur: unknown = data;
  for (const key of path) {
    if (cur == null) return undefined;
    if (Array.isArray(cur)) {
      const idx = Number(key);
      cur = cur[idx];
    } else if (typeof cur === "object") {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cur as FieldValue;
}
