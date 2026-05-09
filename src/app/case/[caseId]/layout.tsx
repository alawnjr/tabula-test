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
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Loading case…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
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
