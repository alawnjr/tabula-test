"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ExtractedDoc, FormPatch } from "@/lib/integrations/types";

export type ReviewBundle = {
  docs: ExtractedDoc[];
  patches: FormPatch[];
};

type AddDocPayload = { doc: ExtractedDoc; patches: FormPatch[] };

type ReviewStore = {
  // keyed by caseId
  bundles: Record<string, ReviewBundle | undefined>;
  setBundle: (caseId: string, bundle: ReviewBundle) => void;
  addDoc: (caseId: string, payload: AddDocPayload) => void;
  removeDocByLabel: (caseId: string, sourceLabel: string) => void;
  updatePatch: (
    caseId: string,
    patchId: string,
    op: FormPatch["op"]
  ) => void;
  removePatch: (caseId: string, patchId: string) => void;
  clearBundle: (caseId: string) => void;
};

function withoutBundle(
  bundles: Record<string, ReviewBundle | undefined>,
  caseId: string
): Record<string, ReviewBundle | undefined> {
  const next = { ...bundles };
  delete next[caseId];
  return next;
}

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set) => ({
      bundles: {},

      setBundle: (caseId, bundle) =>
        set((s) => ({ bundles: { ...s.bundles, [caseId]: bundle } })),

      // Append a doc + its patches to the current bundle. If a doc already
      // exists with the same sourceLabel (same filename, same Teller account),
      // it is replaced — keeps re-uploads / re-pulls from duplicating entries.
      addDoc: (caseId, { doc, patches }) =>
        set((s) => {
          const existing = s.bundles[caseId];
          const filteredDocs = (existing?.docs ?? []).filter(
            (d) => d.sourceLabel !== doc.sourceLabel
          );
          const filteredPatches = (existing?.patches ?? []).filter(
            (p) => p.sourceLabel !== doc.sourceLabel
          );
          return {
            bundles: {
              ...s.bundles,
              [caseId]: {
                docs: [...filteredDocs, doc],
                patches: [...filteredPatches, ...patches],
              },
            },
          };
        }),

      removeDocByLabel: (caseId, sourceLabel) =>
        set((s) => {
          const existing = s.bundles[caseId];
          if (!existing) return s;
          const docs = existing.docs.filter(
            (d) => d.sourceLabel !== sourceLabel
          );
          const patches = existing.patches.filter(
            (p) => p.sourceLabel !== sourceLabel
          );
          if (docs.length === 0) {
            return { bundles: withoutBundle(s.bundles, caseId) };
          }
          return {
            bundles: { ...s.bundles, [caseId]: { docs, patches } },
          };
        }),

      updatePatch: (caseId, patchId, op) =>
        set((s) => {
          const existing = s.bundles[caseId];
          if (!existing) return s;
          const patches = existing.patches.map((p) =>
            p.id === patchId ? { ...p, op } : p
          );
          return {
            bundles: { ...s.bundles, [caseId]: { ...existing, patches } },
          };
        }),

      removePatch: (caseId, patchId) =>
        set((s) => {
          const existing = s.bundles[caseId];
          if (!existing) return s;
          const patches = existing.patches.filter((p) => p.id !== patchId);
          return {
            bundles: { ...s.bundles, [caseId]: { ...existing, patches } },
          };
        }),

      clearBundle: (caseId) =>
        set((s) => ({ bundles: withoutBundle(s.bundles, caseId) })),
    }),
    {
      name: "case-builder:review:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
