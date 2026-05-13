"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useCaseStore } from "@/state/case-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { chapterLabel, practiceAreaOf } from "@/lib/schemas";
import { ImportExport } from "./ImportExport";

export function CaseHeader({ caseId }: { caseId: string }) {
  const record = useCaseStore((s) => s.cases[caseId]);
  const deleteCase = useCaseStore((s) => s.deleteCase);
  const loadCase = useCaseStore((s) => s.loadCase);
  const convexRemove = useMutation(api.cases.remove);
  const convexUpdate = useMutation(api.cases.update);
  const shareWithDebtor = useMutation(api.cases.shareWithDebtor);
  const convexCase = useQuery(api.cases.get, { id: caseId as Id<"cases"> });
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareSaving, setShareSaving] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSaved, setShareSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  async function saveRename() {
    if (!record) return;
    setRenaming(false);
    const name = renameVal.trim();
    loadCase({ ...record, debtorName: name });
    await convexUpdate({ id: caseId as Id<"cases">, debtorName: name, updatedAt: new Date().toISOString() });
  }

  if (!record) return null;
  const idShort = record.id.slice(-6).toUpperCase();
  const currentDebtorEmail = convexCase?.debtorEmail;
  const portalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/portal`
    : "/portal";

  function copyLink() {
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--rule-soft)] bg-[var(--paper)]"
      style={{ height: "var(--case-header-h)" }}
    >
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="logo shrink-0">
            Tabula
            <span className="logo-dot" />
          </Link>

          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)]">
            /
          </span>

          <Link
            href={
              record.chapter === "personalInjury"
                ? "/personal-injury"
                : record.chapter === "realEstate"
                ? "/real-estate"
                : "/bankruptcy"
            }
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)] hover:text-[var(--ink)] shrink-0"
          >
            ← Cases
          </Link>

          <span className="hidden font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)] sm:inline">
            ·
          </span>

          <div className="hidden sm:inline-flex sm:items-baseline sm:gap-2 min-w-0">
            {renaming ? (
              <input
                ref={renameRef}
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onBlur={saveRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename();
                  if (e.key === "Escape") setRenaming(false);
                }}
                className="w-48 rounded-[2px] border border-[var(--ink)] bg-transparent px-1 py-0 text-[14px] tracking-[-0.01em] text-[var(--ink)] outline-none"
                style={{ fontFamily: "var(--serif)" }}
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => { setRenameVal(record.debtorName); setRenaming(true); }}
                className="truncate text-[14px] tracking-[-0.01em] text-[var(--ink)] hover:text-[var(--ink-2)] text-left"
                style={{ fontFamily: "var(--serif)" }}
                title="Click to rename"
              >
                {record.debtorName || (
                  <em className="text-[var(--mute)]">
                    {practiceAreaOf(record.chapter) === "bankruptcy"
                      ? "Untitled debtor"
                      : "Untitled client"}
                  </em>
                )}
              </button>
            )}
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)] shrink-0">
              № {idShort}
            </span>
          </div>

          <Badge variant="outline">{chapterLabel(record.chapter)}</Badge>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ImportExport caseId={caseId} />

          {/* Share with client */}
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShareEmail(currentDebtorEmail ?? "");
                setShareSaved(false);
                setShareOpen((o) => !o);
              }}
            >
              {currentDebtorEmail ? "Shared ✓" : "Share"}
            </Button>
            {shareOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-[3px] border border-[var(--rule)] bg-[var(--paper)] p-3 shadow-lg">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  Share with client
                </p>

                {shareSaved ? (
                  /* Post-save state: show copyable link */
                  <div className="space-y-2">
                    <p className="text-[11px] text-[var(--ink-2)]">
                      Shared with{" "}
                      <span className="font-mono text-[var(--ink)]">{currentDebtorEmail ?? shareEmail.trim()}</span>.
                      Send them this link to access their portal:
                    </p>
                    <div className="flex items-center gap-1.5 rounded-[2px] border border-[var(--rule)] bg-[var(--paper-2)] px-2.5 py-1.5">
                      <span className="flex-1 truncate font-mono text-[10px] text-[var(--ink)]">
                        {portalUrl}
                      </span>
                      <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={copyLink}>
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <p className="text-[10px] text-[var(--mute)]">
                      They&apos;ll need to sign in with that email address.
                    </p>
                    <Button size="sm" variant="ghost" className="w-full" onClick={() => setShareOpen(false)}>
                      Done
                    </Button>
                  </div>
                ) : (
                  /* Default state: email input */
                  <>
                    {currentDebtorEmail && (
                      <div className="mb-3 space-y-1.5">
                        <p className="text-[11px] text-[var(--ink-2)]">
                          Currently shared with{" "}
                          <span className="font-mono text-[var(--ink)]">{currentDebtorEmail}</span>.
                        </p>
                        <div className="flex items-center gap-1.5 rounded-[2px] border border-[var(--rule)] bg-[var(--paper-2)] px-2.5 py-1.5">
                          <span className="flex-1 truncate font-mono text-[10px] text-[var(--ink)]">
                            {portalUrl}
                          </span>
                          <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={copyLink}>
                            {copied ? "Copied!" : "Copy"}
                          </Button>
                        </div>
                      </div>
                    )}
                    <input
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="debtor@email.com"
                      className="mb-2 w-full rounded-[2px] border border-[var(--rule)] bg-[var(--paper-2)] px-2.5 py-1.5 font-mono text-[11px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                    />
                    {shareError && (
                      <p className="mb-2 text-[10px] text-red-600">{shareError}</p>
                    )}
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        disabled={shareSaving}
                        onClick={async () => {
                          setShareSaving(true);
                          setShareError(null);
                          try {
                            await shareWithDebtor({
                              id: caseId as Id<"cases">,
                              email: shareEmail.trim() || null,
                            });
                            setShareSaved(true);
                          } catch (err) {
                            setShareError(err instanceof Error ? err.message : "Save failed.");
                          } finally {
                            setShareSaving(false);
                          }
                        }}
                      >
                        {shareSaving ? "Saving…" : "Save"}
                      </Button>
                      {currentDebtorEmail && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={shareSaving}
                          onClick={async () => {
                            setShareSaving(true);
                            setShareError(null);
                            try {
                              await shareWithDebtor({ id: caseId as Id<"cases">, email: null });
                              setShareOpen(false);
                            } catch (err) {
                              setShareError(err instanceof Error ? err.message : "Revoke failed.");
                            } finally {
                              setShareSaving(false);
                            }
                          }}
                        >
                          Revoke
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setShareOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (confirm("Delete this case? This cannot be undone.")) {
                await convexRemove({ id: caseId as Id<"cases"> });
                deleteCase(caseId);
                window.location.href = "/";
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </header>
  );
}
