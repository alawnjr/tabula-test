"use client";

import { create } from "zustand";
import type { ExtractedDoc, FormPatch } from "@/lib/integrations/types";

type ReviewBundle = {
  doc: ExtractedDoc;
  patches: FormPatch[];
};

type ReviewStore = {
  // keyed by caseId
  bundles: Record<string, ReviewBundle | undefined>;
  setBundle: (caseId: string, bundle: ReviewBundle) => void;
  clearBundle: (caseId: string) => void;
};

export const useReviewStore = create<ReviewStore>((set) => ({
  bundles: {},
  setBundle: (caseId, bundle) =>
    set((s) => ({ bundles: { ...s.bundles, [caseId]: bundle } })),
  clearBundle: (caseId) =>
    set((s) => {
      const next = { ...s.bundles };
      delete next[caseId];
      return { bundles: next };
    }),
}));
