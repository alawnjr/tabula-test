"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCaseStore } from "@/state/case-store";
import { chapterLabel } from "@/lib/schemas";
import { ImportExport } from "@/components/case/ImportExport";
import { caseSummary } from "@/lib/derived";
import { formatCurrency } from "@/lib/currency";

export default function Home() {
  const hydrated = useSyncExternalStore(
    (cb) => useCaseStore.persist.onFinishHydration(cb),
    () => useCaseStore.persist.hasHydrated(),
    () => false
  );

  const cases = useCaseStore((s) => s.cases);
  const createCase = useCaseStore((s) => s.createCase);
  const router = useRouter();

  const onNew = (chapter: "chapter7" | "chapter13") => {
    const id = createCase(chapter);
    router.push(`/case/${id}/101`);
  };

  const list = Object.values(cases).sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : -1
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 space-y-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Bankruptcy
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Case Builder</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Walk through a Chapter 7 or Chapter 13 bankruptcy filing schedule by
          schedule. Cases are saved to your browser only — export to JSON to
          back up or move between devices.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        <Button onClick={() => onNew("chapter7")}>New Chapter 7 case</Button>
        <Button variant="secondary" onClick={() => onNew("chapter13")}>
          New Chapter 13 case
        </Button>
        <ImportExport />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your cases
        </h2>
        {!hydrated ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No cases yet. Create one to get started.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((c) => {
              const s = caseSummary(c);
              return (
                <Link key={c.id} href={`/case/${c.id}`}>
                  <Card className="h-full transition hover:border-foreground/30">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle>
                          {c.debtorName || "Untitled debtor"}
                        </CardTitle>
                        <Badge variant="secondary">
                          {chapterLabel(c.chapter)}
                        </Badge>
                      </div>
                      <CardDescription>
                        Updated{" "}
                        {new Date(c.updatedAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Total assets</span>
                        <span className="tabular-nums">
                          {formatCurrency(s.assets.grand)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total liabilities</span>
                        <span className="tabular-nums">
                          {formatCurrency(s.liabilities.grand)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly net</span>
                        <span className="tabular-nums">
                          {formatCurrency(s.net)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
