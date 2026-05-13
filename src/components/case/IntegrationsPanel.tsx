"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useReviewStore } from "@/state/review-store";
import { useCaseStore } from "@/state/case-store";
import { buildPatches } from "@/lib/integrations/mapping";
import { practiceAreaOf } from "@/lib/schemas";
import type { ExtractedDoc, FormPatch } from "@/lib/integrations/types";
import { cn } from "@/lib/utils";

type Status = "idle" | "uploading" | "extracting" | "teller" | "error";

type Progress = {
  index: number;
  total: number;
  filename: string;
  phase: "uploading" | "extracting";
};

type Toast = { kind: "success"; text: string };

type TellerEnrollment = {
  accessToken: string;
  user?: { id: string };
  enrollment?: { id: string; institution?: { name?: string } };
};

type TellerConnectInstance = { open: () => void };

type TellerConnectGlobal = {
  setup: (opts: {
    applicationId: string;
    environment?: "sandbox" | "development" | "production";
    products?: string[];
    onSuccess: (enrollment: TellerEnrollment) => void;
    onExit?: () => void;
  }) => TellerConnectInstance;
};

declare global {
  interface Window {
    TellerConnect?: TellerConnectGlobal;
  }
}

const TELLER_SCRIPT_SRC = "https://cdn.teller.io/connect/connect.js";

function loadTellerScript(): Promise<TellerConnectGlobal | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.TellerConnect) return Promise.resolve(window.TellerConnect);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TELLER_SCRIPT_SRC}"]`
    );
    const onLoad = () => resolve(window.TellerConnect ?? null);
    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Teller script failed")),
        { once: true }
      );
      return;
    }
    const script = document.createElement("script");
    script.src = TELLER_SCRIPT_SRC;
    script.async = true;
    script.onload = onLoad;
    script.onerror = () => reject(new Error("Teller script failed"));
    document.body.appendChild(script);
  });
}

type TxWindow = 6 | 12;

const ACCEPTED_TYPES = "application/pdf,image/png,image/jpeg";

export function IntegrationsPanel({ caseId }: { caseId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);
  const addDoc = useReviewStore((s) => s.addDoc);
  const setBankData = useCaseStore((s) => s.setBankData);
  const caseChapter = useCaseStore((s) => s.cases[caseId]?.chapter);
  const extractionArea: "bankruptcy" | "estateAdmin" =
    caseChapter && practiceAreaOf(caseChapter) === "estateAdmin"
      ? "estateAdmin"
      : "bankruptcy";
  const generateUploadUrl = useMutation(api.cases.generateUploadUrl);
  const extractFromStorage = useAction(api.extract.extractFromStorage);
  const submitUpload = useMutation(api.cases.submitDebtorUpload);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [txWindow, setTxWindow] = useState<TxWindow>(6);
  const [dragActive, setDragActive] = useState(false);

  const applicationId = process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID;
  const environment = (process.env.NEXT_PUBLIC_TELLER_ENVIRONMENT ??
    "sandbox") as "sandbox" | "development" | "production";

  useEffect(() => {
    if (!applicationId) return;
    loadTellerScript().catch(() => {});
  }, [applicationId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);

    const filtered = files.filter((f) =>
      ACCEPTED_TYPES.split(",").some((t) =>
        t === f.type || (t.endsWith("/*") && f.type.startsWith(t.slice(0, -1)))
      )
    );
    if (filtered.length === 0) {
      setStatus("error");
      setError("Only PDF, PNG, or JPEG files are accepted.");
      return;
    }

    let added = 0;
    let entriesQueued = 0;
    try {
      for (let i = 0; i < filtered.length; i++) {
        const file = filtered[i];
        setProgress({
          index: i + 1,
          total: filtered.length,
          filename: file.name,
          phase: "uploading",
        });
        setStatus("uploading");

        // Upload to Convex storage
        const uploadUrl = await generateUploadUrl();
        const storeRes = await fetch(uploadUrl, {
          method: "POST",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!storeRes.ok) throw new Error(`Storage upload failed for ${file.name}`);
        const { storageId } = (await storeRes.json()) as { storageId: Id<"_storage"> };

        setProgress({ index: i + 1, total: filtered.length, filename: file.name, phase: "extracting" });
        setStatus("extracting");

        // Extract via Convex action (no Vercel timeout)
        const extracted = (await extractFromStorage({
          storageId,
          filename: file.name,
          mimeType: file.type,
          practiceArea: extractionArea,
        })) as ExtractedDoc;

        const patches = buildPatches(extracted);
        addDoc(caseId, { doc: extracted, patches });
        await submitUpload({
          id: caseId as Id<"cases">,
          extractedDoc: extracted,
          patches,
          uploadedAt: extracted.extractedAt,
          storageId,
        });
        added += 1;
        entriesQueued += patches.length;
      }
      setStatus("idle");
      setProgress(null);
      if (added > 0) {
        setToast({
          kind: "success",
          text: `${added} ${added === 1 ? "document" : "documents"} processed · ${entriesQueued} ${entriesQueued === 1 ? "entry" : "entries"} ready for review`,
        });
        router.push(`/case/${caseId}/review`);
      }
    } catch (err) {
      setStatus("error");
      setProgress(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleFiles: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    await processFiles(files);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCount.current = 0;
    setDragActive(false);
    if (busy) return;
    const files = Array.from(e.dataTransfer.files ?? []);
    await processFiles(files);
  };

  const onDragEnter: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    dragCount.current += 1;
    setDragActive(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCount.current = Math.max(0, dragCount.current - 1);
    if (dragCount.current === 0) setDragActive(false);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  };

  const finishConnect = async (accessToken: string, months: TxWindow) => {
    const enrollRes = await fetch("/api/teller/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, caseId }),
    });
    if (!enrollRes.ok) {
      const j = await enrollRes.json().catch(() => ({}));
      throw new Error(j.error ?? `Enroll failed (${enrollRes.status})`);
    }
    const pullRes = await fetch("/api/teller/pull", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, months }),
    });
    if (!pullRes.ok) {
      const j = await pullRes.json().catch(() => ({}));
      throw new Error(j.error ?? `Teller pull failed (${pullRes.status})`);
    }
    const data = (await pullRes.json()) as {
      extracted: ExtractedDoc;
      patches: FormPatch[];
    };
    if (data.extracted.source === "teller") {
      setBankData(caseId, data.extracted);
    }
    addDoc(caseId, { doc: data.extracted, patches: data.patches });
    setStatus("idle");
    const tx = data.extracted.transactions?.length ?? 0;
    setToast({
      kind: "success",
      text: `Bank connected · ${data.patches.length} ${data.patches.length === 1 ? "entry" : "entries"} ready · ${tx} transactions pulled`,
    });
    router.push(`/case/${caseId}/review`);
  };

  const handleConnect = async () => {
    setError(null);
    setStatus("teller");
    const months = txWindow;

    if (!applicationId) {
      try {
        await finishConnect("demo-access-token", months);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : String(err));
      }
      return;
    }

    try {
      const tc = await loadTellerScript();
      if (!tc) throw new Error("Teller Connect failed to load");
      const instance = tc.setup({
        applicationId,
        environment,
        products: ["verify", "balance", "transactions"],
        onSuccess: (enrollment) => {
          finishConnect(enrollment.accessToken, months).catch((err) => {
            setStatus("error");
            setError(err instanceof Error ? err.message : String(err));
          });
        },
        onExit: () => {
          setStatus((s) => (s === "teller" ? "idle" : s));
        },
      });
      instance.open();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const busy =
    status === "uploading" || status === "extracting" || status === "teller";

  const phaseLabel = (() => {
    if (!progress) return null;
    const verb =
      progress.phase === "uploading" ? "Uploading" : "Reading with Claude";
    return `${verb} · ${progress.index} of ${progress.total} · ${progress.filename}`;
  })();

  const tellerLabel = !applicationId ? "Demo bank" : "Teller";

  return (
    <section className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--rule-soft)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-[var(--accent-deep)]" />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--mute)]">
            Intake · auto-fill from documents or bank
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          {applicationId ? "Live" : "Demo mode"}
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_auto_1fr]">
        {/* DOCUMENTS */}
        <div
          className={cn(
            "relative flex flex-col gap-3 px-4 py-4 transition-colors",
            dragActive
              ? "bg-[color-mix(in_oklch,var(--accent)_8%,var(--paper-2))]"
              : ""
          )}
          onDrop={onDrop}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
        >
          <button
            type="button"
            onClick={() => !busy && fileRef.current?.click()}
            disabled={busy}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-2 rounded-[3px] border border-dashed py-7 px-4 text-center transition-colors",
              dragActive
                ? "border-[var(--accent-deep)] bg-[color-mix(in_oklch,var(--accent)_12%,var(--paper))]"
                : "border-[var(--rule)] bg-[var(--paper)] hover:border-[var(--ink)] hover:bg-[var(--paper)]",
              busy && "opacity-60"
            )}
          >
            {status === "uploading" || status === "extracting" ? (
              <Loader2 className="h-5 w-5 animate-spin text-[var(--ink-2)]" />
            ) : (
              <UploadCloud
                className={cn(
                  "h-5 w-5 transition-transform",
                  dragActive
                    ? "text-[var(--accent-deep)] -translate-y-0.5"
                    : "text-[var(--ink-2)] group-hover:-translate-y-0.5"
                )}
              />
            )}
            <span
              className="text-[14px] tracking-[-0.015em] text-[var(--ink)]"
              style={{ fontFamily: "var(--serif)" }}
            >
              {dragActive ? "Drop to read" : "Drop documents or click to browse"}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
              PDF · PNG · JPG · multiple OK
            </span>
          </button>
          <p className="text-[11px] leading-relaxed text-[var(--mute)]">
            Statements, pay stubs, mortgage notices, tax returns. Claude reads
            each one and proposes schedule entries you confirm before they land.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </div>

        {/* DIVIDER */}
        <div className="relative hidden md:flex items-center justify-center px-1">
          <div className="absolute inset-y-3 left-1/2 -translate-x-1/2 w-px bg-[var(--rule-soft)]" />
          <span className="relative bg-[var(--paper-2)] px-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--mute)]">
            or
          </span>
        </div>
        <div className="md:hidden flex items-center gap-2 px-4">
          <span className="h-px flex-1 bg-[var(--rule-soft)]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--mute)]">
            or
          </span>
          <span className="h-px flex-1 bg-[var(--rule-soft)]" />
        </div>

        {/* BANK */}
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border border-[var(--rule)] bg-[var(--paper)]">
              <Banknote className="h-4 w-4 text-[var(--ink-2)]" />
            </div>
            <div className="min-w-0">
              <h3
                className="text-[14px] tracking-[-0.015em] text-[var(--ink)]"
                style={{ fontFamily: "var(--serif)" }}
              >
                Connect a bank
              </h3>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--mute)]">
                Pull balances, accounts, and transaction history through{" "}
                {tellerLabel}. Re-runnable from this page without re-auth.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
              History
            </span>
            <div
              className="inline-flex overflow-hidden rounded-[3px] border border-[var(--rule)] text-[10px]"
              role="radiogroup"
              aria-label="Transaction history window"
            >
              {([6, 12] as TxWindow[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={txWindow === m}
                  onClick={() => setTxWindow(m)}
                  disabled={busy}
                  className={cn(
                    "px-2.5 py-1 font-mono uppercase tracking-[0.08em] transition-colors",
                    txWindow === m
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "bg-[var(--paper)] text-[var(--mute)] hover:bg-[var(--paper-3)]"
                  )}
                >
                  {m === 6 ? "6 mo" : "1 yr"}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleConnect} disabled={busy} className="self-start">
            {status === "teller" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Banknote className="h-3 w-3" />
            )}
            {status === "teller" ? "Connecting…" : "Connect bank →"}
          </Button>
        </div>
      </div>

      {/* PROGRESS */}
      {progress ? (
        <div className="border-t border-[var(--rule-soft)] bg-[var(--paper)]">
          <div className="h-1 w-full bg-[var(--paper-3)] overflow-hidden">
            <div
              className={cn(
                "h-full bg-[var(--accent-deep)] transition-all duration-500",
                progress.phase === "extracting" && "animate-pulse"
              )}
              style={{
                width: `${
                  ((progress.index - (progress.phase === "uploading" ? 0.5 : 0)) /
                    progress.total) *
                  100
                }%`,
              }}
            />
          </div>
          <p className="px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-2)] truncate flex items-center gap-2">
            {progress.phase === "extracting" ? (
              <FileText className="h-3 w-3" />
            ) : (
              <UploadCloud className="h-3 w-3" />
            )}
            {phaseLabel}
          </p>
        </div>
      ) : null}

      {/* ERROR */}
      {error ? (
        <p className="border-t border-[var(--rule-soft)] bg-[color-mix(in_oklch,var(--destructive)_8%,var(--paper-2))] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--destructive)]">
          {error}
        </p>
      ) : null}

      {/* TOAST */}
      {toast ? (
        <p className="border-t border-[var(--rule-soft)] bg-[color-mix(in_oklch,var(--accent)_8%,var(--paper-2))] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--accent-deep)] flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3" />
          {toast.text}
        </p>
      ) : null}
    </section>
  );
}
