"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useCaseStore } from "@/state/case-store";
import { ConvexStoreSync } from "@/components/ConvexStoreSync";
import { CaseHeader } from "@/components/case/CaseHeader";
import { CaseSidebar } from "@/components/case/CaseSidebar";

export default function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const setActive = useCaseStore((s) => s.setActiveCase);
  const loadCase = useCaseStore((s) => s.loadCase);
  const exists = useCaseStore((s) => Boolean(s.cases[caseId]));
  const router = useRouter();

  // Fetch from Convex if not already in local store (direct URL navigation)
  const convexCase = useQuery(
    api.cases.get,
    exists ? "skip" : { id: caseId as Id<"cases"> }
  );

  useEffect(() => {
    if (convexCase) {
      const data = (convexCase.data ?? {}) as Record<string, unknown>;
      loadCase({
        id: convexCase._id,
        chapter: convexCase.chapter,
        debtorName: convexCase.debtorName,
        createdAt: convexCase.createdAt,
        updatedAt: convexCase.updatedAt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        forms: (data.forms as any) ?? {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bankData: data.bankData as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        autofilled: data.autofilled as any,
      });
    }
  }, [convexCase, loadCase]);

  useEffect(() => {
    setActive(caseId);
  }, [caseId, setActive]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = setTimeout(() => {
        const stillMissing = !useCaseStore.getState().cases[caseId];
        if (stillMissing) router.push("/");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [caseId, router]);

  if (!exists) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Loading case…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ConvexStoreSync />
      <CaseHeader caseId={caseId} />
      <div className="flex flex-1">
        <aside className="hidden w-[224px] shrink-0 border-r border-[var(--rule-soft)] px-2 py-4 lg:block">
          <CaseSidebar caseId={caseId} />
        </aside>
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
