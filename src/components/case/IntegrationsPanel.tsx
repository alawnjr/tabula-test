"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Banknote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReviewStore } from "@/state/review-store";
import { useCaseStore } from "@/state/case-store";
import type { ExtractedDoc, FormPatch } from "@/lib/integrations/types";
import { cn } from "@/lib/utils";

type Status = "idle" | "uploading" | "extracting" | "teller" | "error";

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
      existing.addEventListener("error", () => reject(new Error("Teller script failed")), { once: true });
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

export function IntegrationsPanel({ caseId }: { caseId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const setBundle = useReviewStore((s) => s.setBundle);
  const setBankData = useCaseStore((s) => s.setBankData);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txWindow, setTxWindow] = useState<TxWindow>(6);

  const applicationId = process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID;
  const environment = (process.env.NEXT_PUBLIC_TELLER_ENVIRONMENT ??
    "sandbox") as "sandbox" | "development" | "production";

  useEffect(() => {
    if (!applicationId) return;
    loadTellerScript().catch(() => {});
  }, [applicationId]);

  const handleFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      setStatus("uploading");
      const fd = new FormData();
      fd.append("file", file);
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!upRes.ok) {
        const j = await upRes.json().catch(() => ({}));
        throw new Error(j.error ?? `Upload failed (${upRes.status})`);
      }
      const { docId } = (await upRes.json()) as { docId: string };

      setStatus("extracting");
      const exRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });
      if (!exRes.ok) {
        const j = await exRes.json().catch(() => ({}));
        throw new Error(j.error ?? `Extraction failed (${exRes.status})`);
      }
      const data = (await exRes.json()) as {
        extracted: ExtractedDoc;
        patches: FormPatch[];
      };
      setBundle(caseId, { doc: data.extracted, patches: data.patches });
      setStatus("idle");
      router.push(`/case/${caseId}/review`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
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
    setBundle(caseId, { doc: data.extracted, patches: data.patches });
    setStatus("idle");
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

  return (
    <section className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)]">
      <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
            Intake
          </span>
          <h3
            className="text-[15px] tracking-[-0.015em] text-[var(--ink)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            Pull data automatically
          </h3>
          <p className="text-[11px] text-[var(--mute)]">
            Upload a financial document, or connect a bank, then review the
            proposed schedule entries.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {status === "uploading" || status === "extracting" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <FileUp className="h-3 w-3" />
            )}
            {status === "uploading"
              ? "Uploading…"
              : status === "extracting"
              ? "Extracting…"
              : "Upload document"}
          </Button>

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
                  "px-2 py-1 font-mono uppercase tracking-[0.08em] transition-colors",
                  txWindow === m
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "bg-[var(--paper)] text-[var(--mute)] hover:bg-[var(--paper-3)]"
                )}
              >
                {m === 6 ? "6 mo" : "1 yr"}
              </button>
            ))}
          </div>

          <Button size="sm" onClick={handleConnect} disabled={busy}>
            {status === "teller" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Banknote className="h-3 w-3" />
            )}
            {status === "teller" ? "Connecting…" : "Connect bank"}
          </Button>

          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>
      {error ? (
        <p className="border-t border-[var(--rule-soft)] bg-[color-mix(in_oklch,var(--destructive)_8%,var(--paper-2))] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--destructive)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
