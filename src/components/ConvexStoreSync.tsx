"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useCaseStore, type CaseRecord } from "@/state/case-store";

function convexDocToRecord(doc: {
  _id: Id<"cases">;
  chapter: CaseRecord["chapter"];
  debtorName: string;
  createdAt: string;
  updatedAt: string;
  data: unknown;
}): CaseRecord {
  const data = (doc.data ?? {}) as Partial<CaseRecord>;
  return {
    id: doc._id,
    chapter: doc.chapter,
    debtorName: doc.debtorName,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    forms: data.forms ?? {},
    bankData: data.bankData,
    autofilled: data.autofilled,
  };
}

export function ConvexStoreSync() {
  const { isLoaded: clerkLoaded } = useUser();
  const setCases = useCaseStore((s) => s.setCases);
  const setLoaded = useCaseStore((s) => s.setLoaded);
  const cases = useCaseStore((s) => s.cases);
  const updateCase = useMutation(api.cases.update);

  // Skip the query until Clerk has resolved its session — otherwise Convex
  // runs unauthenticated first (returning []), the hydration ref flips, and
  // the real cases that arrive after auth are silently dropped.
  const convexCases = useQuery(
    api.cases.listByUser,
    clerkLoaded ? {} : "skip"
  );

  // Initial hydration: load all Convex cases into Zustand
  const hydrated = useRef(false);
  useEffect(() => {
    if (convexCases === undefined) return;
    if (hydrated.current) return;
    hydrated.current = true;
    if (convexCases.length === 0) {
      setLoaded();
    } else {
      setCases(convexCases.map(convexDocToRecord));
    }
  }, [convexCases, setCases, setLoaded]);

  // Debounced sync: push Zustand mutations back to Convex
  const prevRef = useRef<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const changed: CaseRecord[] = [];
    for (const c of Object.values(cases)) {
      if (prevRef.current[c.id] !== c.updatedAt) {
        prevRef.current[c.id] = c.updatedAt;
        changed.push(c);
      }
    }
    if (changed.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      for (const c of changed) {
        void updateCase({
          id: c.id as Id<"cases">,
          debtorName: c.debtorName,
          updatedAt: c.updatedAt,
          data: { forms: c.forms, bankData: c.bankData, autofilled: c.autofilled },
        });
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cases, updateCase]);

  return null;
}
