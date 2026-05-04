"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Banknote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReviewStore } from "@/state/review-store";
import type { ExtractedDoc, FormPatch } from "@/lib/integrations/types";

type Status = "idle" | "uploading" | "extracting" | "plaid" | "error";

export function IntegrationsPanel({ caseId }: { caseId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const setBundle = useReviewStore((s) => s.setBundle);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

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

  const handlePlaid = async () => {
    setError(null);
    try {
      setStatus("plaid");
      // Demo path: directly exchange a fake token + pull. Real Plaid Link
      // integration plugs in here when keys are present (see PLAID_*).
      await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: "demo-public-token", caseId }),
      });
      const pullRes = await fetch("/api/plaid/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      if (!pullRes.ok) {
        const j = await pullRes.json().catch(() => ({}));
        throw new Error(j.error ?? `Plaid pull failed (${pullRes.status})`);
      }
      const data = (await pullRes.json()) as {
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

  const busy = status === "uploading" || status === "extracting" || status === "plaid";

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
          <Button size="sm" onClick={handlePlaid} disabled={busy}>
            {status === "plaid" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Banknote className="h-4 w-4" />
            )}
            {status === "plaid" ? "Connecting…" : "Connect bank"}
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
