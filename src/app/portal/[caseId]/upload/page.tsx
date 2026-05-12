"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildPatches } from "@/lib/integrations/mapping";
import type { ExtractedDoc } from "@/lib/integrations/types";

type ExtractResult = ExtractedDoc & { _storageId?: string };

type Phase = "idle" | "uploading" | "extracting" | "done" | "error";

const ACCEPTED = "application/pdf,image/png,image/jpeg";

export default function PortalUploadPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const submitUpload = useMutation(api.cases.submitDebtorUpload);
  const generateUploadUrl = useMutation(api.cases.generateUploadUrl);
  const extractFromStorage = useAction(api.extract.extractFromStorage);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [docType, setDocType] = useState<string | null>(null);
  const [patchCount, setPatchCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  async function processFile(file: File) {
    setError(null);
    setPhase("uploading");
    try {
      // Upload to Convex storage
      const uploadUrl = await generateUploadUrl();
      const storeRes = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!storeRes.ok) throw new Error("Storage upload failed");
      const { storageId } = await storeRes.json() as { storageId: Id<"_storage"> };

      // Extract via Convex action (runs on Convex, not Vercel — no 10s timeout)
      setPhase("extracting");
      const result = await extractFromStorage({
        storageId,
        filename: file.name,
        mimeType: file.type,
      }) as ExtractResult;

      const { _storageId, ...extracted } = result;
      const patches = buildPatches(extracted);
      const uploadedAt = new Date().toISOString();

      // Persist to Convex so attorney can review and apply
      await submitUpload({
        id: caseId as Id<"cases">,
        extractedDoc: extracted,
        patches,
        uploadedAt,
        storageId: _storageId,
      });

      setDocType(extracted.sourceLabel ?? "document");
      setPatchCount(patches.length);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPhase("error");
    }
  }

  function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) processFile(file);
  }

  const busy = phase === "uploading" || phase === "extracting";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={`/portal/${caseId}`}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← Back to overview
        </Link>
        <h1
          className="mt-2 text-[22px] tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          Upload documents
        </h1>
        <p className="text-[13px] text-[var(--ink-2)]">
          Upload bank statements, pay stubs, tax returns, or mortgage statements.
          Claude will read the document and extract the relevant data for your attorney to review.
        </p>
      </div>

      {phase === "done" ? (
        <div className="flex flex-col items-center gap-3 rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper-2)] px-6 py-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-[var(--accent-deep)]" strokeWidth={1.5} />
          <p
            className="text-[16px] tracking-[-0.01em] text-[var(--ink)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            Document received
          </p>
          <p className="text-[12px] text-[var(--mute)]">
            We extracted {patchCount} data point{patchCount !== 1 ? "s" : ""} from your {docType}.
            Your attorney will review the extracted data before it&apos;s added to your case.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setPhase("idle")}>
              Upload another
            </Button>
            <Link href={`/portal/${caseId}`}>
              <Button>Back to case</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div
            onDragEnter={(e) => { e.preventDefault(); dragActive || setDragActive(true); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); onFiles(e.dataTransfer.files); }}
            onClick={() => !busy && fileRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-3 rounded-[3px] border-2 border-dashed px-6 py-12 text-center transition-colors",
              dragActive
                ? "border-[var(--ink)] bg-[var(--paper-2)]"
                : "border-[var(--rule)] bg-[var(--paper)] hover:border-[var(--mute)] hover:bg-[var(--paper-2)]",
              busy && "pointer-events-none opacity-60"
            )}
          >
            {busy ? (
              <Loader2 className="h-7 w-7 animate-spin text-[var(--mute)]" strokeWidth={1.5} />
            ) : dragActive ? (
              <FileText className="h-7 w-7 text-[var(--ink)]" strokeWidth={1.5} />
            ) : (
              <UploadCloud className="h-7 w-7 text-[var(--mute)]" strokeWidth={1.5} />
            )}
            <div>
              <p className="text-[14px] text-[var(--ink)]">
                {busy
                  ? phase === "uploading"
                    ? "Uploading…"
                    : "Extracting data with Claude…"
                  : "Drop a file here or click to browse"}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--mute)]">
                PDF, PNG, or JPEG — bank statements, pay stubs, tax returns
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </div>

          {error && (
            <p className="rounded-[3px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {error}
            </p>
          )}
        </>
      )}

      <div className="rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper-2)] p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
          What to upload
        </p>
        <ul className="mt-2 space-y-1 text-[12px] text-[var(--ink-2)]">
          <li>• Bank statements (checking, savings, investment accounts)</li>
          <li>• Recent pay stubs (last 2–3 months)</li>
          <li>• Most recent tax return</li>
          <li>• Mortgage or auto loan statements</li>
          <li>• Credit card statements</li>
        </ul>
      </div>
    </div>
  );
}
