"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChapterId } from "@/lib/schemas/types";
import type { ExtractedDoc } from "@/lib/integrations/types";

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

export type CaseRecord = {
  id: string;
  chapter: ChapterId;
  debtorName: string;
  createdAt: string;
  updatedAt: string;
  forms: Record<string, FormData>;
  bankData?: PersistedBankData;
};

type CaseStore = {
  cases: Record<string, CaseRecord>;
  activeCaseId: string | null;

  createCase: (chapter: ChapterId) => string;
  setActiveCase: (id: string | null) => void;
  deleteCase: (id: string) => void;

  setFieldValue: (formId: string, path: string[], value: FieldValue) => void;
  appendRepeatingItem: (formId: string, groupId: string) => void;
  removeRepeatingItem: (formId: string, groupId: string, index: number) => void;

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

const debtor1NameKeys = [
  "debtor1NameFirst",
  "debtor1NameMiddle",
  "debtor1NameLast",
];

function deriveDebtorName(forms: Record<string, FormData>): string {
  const f = forms["101"] ?? {};
  const parts = debtor1NameKeys.map((k) => (f[k] as string | undefined) ?? "");
  const joined = parts.filter(Boolean).join(" ").trim();
  return joined;
}

export const useCaseStore = create<CaseStore>()(
  persist(
    (set, get) => ({
      cases: {},
      activeCaseId: null,

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
            formId === "101" ? deriveDebtorName(newForms) : c.debtorName;
          return {
            cases: {
              ...s.cases,
              [id]: {
                ...c,
                forms: newForms,
                debtorName,
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
          return {
            cases: {
              ...s.cases,
              [id]: { ...c, forms: newForms, updatedAt: nowIso() },
            },
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
    }),
    {
      name: "case-builder:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

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
