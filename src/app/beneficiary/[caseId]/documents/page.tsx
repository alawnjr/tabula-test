"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function DocumentsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const generateUploadUrl = useMutation(api.cases.generateUploadUrl);
  const submitUpload = useMutation(api.cases.submitDebtorUpload);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploadedNames: string[] = [];
      for (const file of Array.from(files)) {
        const url = await generateUploadUrl();
        const res = await fetch(url, {
          method: "POST",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
        const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
        const uploadedAt = new Date().toISOString();
        await submitUpload({
          id: caseId as Id<"cases">,
          extractedDoc: {
            source: "upload",
            sourceLabel: file.name,
            extractedAt: uploadedAt,
            items: [],
            rawSummary: "Document uploaded by beneficiary.",
          },
          patches: [],
          uploadedAt,
          storageId,
        });
        uploadedNames.push(file.name);
      }
      setUploaded((prev) => [...prev, ...uploadedNames]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={`/beneficiary/${caseId}`}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← Estate overview
        </Link>
        <h1
          className="mt-2 text-[24px] tracking-[-0.02em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          <em>Documents</em>
        </h1>
        <p className="text-[13px] text-[var(--ink-2)]">
          Upload anything the executor has asked for — government ID, address
          verification, beneficiary form. Files are visible to the executor and
          the attorney handling the estate.
        </p>
      </div>

      <label className="block rounded-[3px] border border-dashed border-[var(--rule)] bg-[var(--paper-2)] p-6 text-center cursor-pointer hover:border-[var(--ink)]">
        <input
          type="file"
          multiple
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <span
          className="block text-[15px] tracking-[-0.015em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          {uploading ? "Uploading…" : "Click to select files"}
        </span>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          PDF, PNG, JPEG
        </span>
      </label>

      {error ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--destructive)]">
          {error}
        </p>
      ) : null}

      {uploaded.length > 0 ? (
        <section className="space-y-2">
          <p className="tag">Uploaded</p>
          <ul className="space-y-1">
            {uploaded.map((name) => (
              <li
                key={name}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]"
              >
                ✓ {name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
