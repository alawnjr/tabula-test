"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="sticky top-0 z-30 border-b border-[var(--rule-soft)] bg-[var(--paper)]"
        style={{ height: "var(--case-header-h)" }}
      >
        <div className="mx-auto flex h-full max-w-4xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Link href="/portal" className="logo">
              Tabula<span className="logo-dot" />
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)]">
              / Client Portal
            </span>
          </div>
          <UserButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        {children}
      </main>
    </div>
  );
}
