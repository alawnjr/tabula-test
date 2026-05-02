"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore } from "@/state/case-store";
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
  const exists = useCaseStore((s) => Boolean(s.cases[caseId]));
  const router = useRouter();

  useEffect(() => {
    setActive(caseId);
  }, [caseId, setActive]);

  // After hydration, if the case doesn't exist, send the user back to the index.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = setTimeout(() => {
        const stillMissing = !useCaseStore.getState().cases[caseId];
        if (stillMissing) router.push("/");
      }, 200);
      return () => clearTimeout(t);
    }
  }, [caseId, router]);

  if (!exists) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading case…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <CaseHeader caseId={caseId} />
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-muted/20 px-3 py-6 lg:block">
          <CaseSidebar caseId={caseId} />
        </aside>
        <main className="flex-1 overflow-x-hidden px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
