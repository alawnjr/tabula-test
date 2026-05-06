"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Banknote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReviewStore } from "@/state/review-store";
import { useCaseStore } from "@/state/case-store";
import type { ExtractedDoc, FormPatch } from "@/lib/integrations/types";

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
    loadTellerScript().catch(() => {
      // Non-fatal; the click handler will retry / fall back to demo path.
    });
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

    // Demo fallback: no applicationId configured → skip Teller Connect UI and
    // hit the mock branch via the special "demo-access-token".
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

  const busy = status === "uploading" || status === "extracting" || status === "teller";

  return (
    <section className="rounded-lg border border-border bg-card px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Pull data automatically</h3>
          <p className="text-xs text-muted-foreground">
            Upload a financial document, or connect a bank, then review the proposed schedule entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {status === "uploading" || status === "extracting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            {status === "uploading"
              ? "Uploading…"
              : status === "extracting"
              ? "Extracting…"
              : "Upload document"}
          </Button>
          <div
            className="inline-flex overflow-hidden rounded-md border border-border text-xs"
            role="radiogroup"
            aria-label="Transaction history window"
          >
            <button
              type="button"
              role="radio"
              aria-checked={txWindow === 6}
              onClick={() => setTxWindow(6)}
              disabled={busy}
              className={`px-2.5 py-1 transition-colors ${
                txWindow === 6
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              6 mo
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={txWindow === 12}
              onClick={() => setTxWindow(12)}
              disabled={busy}
              className={`px-2.5 py-1 transition-colors ${
                txWindow === 12
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              1 yr
            </button>
          </div>
          <Button size="sm" onClick={handleConnect} disabled={busy}>
            {status === "teller" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Banknote className="h-4 w-4" />
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
        <p className="mt-3 rounded border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
