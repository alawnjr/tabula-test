"use client";

import { use, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Pencil, Trash2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

function FileUrlButton({ caseId, uploadedAt }: { caseId: string; uploadedAt: string }) {
  const url = useQuery(api.cases.getUploadFileUrl, {
    id: caseId as Id<"cases">,
    uploadedAt,
  });
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
      aria-label="View file"
    >
      <ExternalLink className="h-3 w-3" />
      View
    </a>
  );
}

function FileRow({
  file,
  caseId,
  onRename,
  onDelete,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file: any;
  caseId: string;
  onRename: (uploadedAt: string, newName: string) => Promise<void>;
  onDelete: (uploadedAt: string) => Promise<void>;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState<string>("");

  const displayName =
    file.filename ?? file.extractedDoc?.sourceLabel ?? "Untitled";

  const startRename = () => {
    setRenameVal(displayName);
    setRenaming(true);
  };

  const commitRename = async () => {
    setRenaming(false);
    const trimmed = renameVal.trim();
    if (trimmed && trimmed !== displayName) {
      await onRename(file.uploadedAt, trimmed);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${displayName}"? This cannot be undone.`)) return;
    await onDelete(file.uploadedAt);
  };

  const uploadDate = file.uploadedAt
    ? new Date(file.uploadedAt).toLocaleDateString(undefined, { dateStyle: "medium" })
    : "—";

  const reviewed = Boolean(file.reviewed);

  return (
    <li className="group flex items-start gap-3 border-b border-[var(--rule-soft)] py-3 last:border-0">
      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mute)]" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        {renaming ? (
          <input
            autoFocus
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            className="w-full border-b border-[var(--ink)] bg-transparent text-[14px] tracking-[-0.01em] text-[var(--ink)] outline-none"
            style={{ fontFamily: "var(--serif)" }}
          />
        ) : (
          <p
            className="truncate text-[14px] tracking-[-0.01em] text-[var(--ink)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            {displayName}
          </p>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--mute)]">
            {uploadDate}
          </span>
          {!reviewed && (
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-2)]">
              In review
            </span>
          )}
          {file.storageId ? (
            <FileUrlButton caseId={caseId} uploadedAt={file.uploadedAt} />
          ) : null}
        </div>
        {file.extractedDoc?.rawSummary ? (
          <p
            className="mt-1 max-w-[60ch] text-[12px] italic text-[var(--ink-2)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            {file.extractedDoc.rawSummary}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={startRename}
          className="rounded p-1 text-[var(--mute)] hover:text-[var(--ink)]"
          aria-label="Rename"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded p-1 text-[var(--mute)] hover:text-[var(--destructive)]"
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

export default function FilesPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const uploads = useQuery(api.cases.getDebtorUploads, { id: caseId as Id<"cases"> });
  const renameUpload = useMutation(api.cases.renameUpload);
  const deleteUpload = useMutation(api.cases.deleteUpload);

  // Only show uploads that have a stored file
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = uploads?.filter((u: any) => u.storageId) ?? [];

  const handleRename = async (uploadedAt: string, filename: string) => {
    try {
      await renameUpload({ id: caseId as Id<"cases">, uploadedAt, filename });
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const handleDelete = async (uploadedAt: string) => {
    try {
      await deleteUpload({ id: caseId as Id<"cases">, uploadedAt });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8 space-y-6">
      <header className="space-y-1">
        <span className="tag">Files</span>
        <h1
          className="text-[26px] leading-[1.05] tracking-[-0.025em] text-[var(--ink)]"
          style={{ fontFamily: "var(--serif)" }}
        >
          Uploaded documents
        </h1>
        <p className="text-[13px] text-[var(--mute)]">
          Documents uploaded by the debtor or attorney. Files marked &ldquo;In review&rdquo; are pending attorney approval.
        </p>
      </header>

      {uploads === undefined ? (
        <p className="text-[12.5px] text-[var(--mute)]">Loading…</p>
      ) : files.length === 0 ? (
        <div className="rounded-[3px] border border-dashed border-[var(--rule)] bg-[var(--paper-2)] px-5 py-9 text-center">
          <p
            className="text-[15px] tracking-[-0.01em] text-[var(--ink-2)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            <em>No files yet.</em>
          </p>
          <p className="mt-1.5 text-[12px] text-[var(--mute)]">
            Files appear here after upload. Upload documents from the data room or debtor portal.
          </p>
        </div>
      ) : (
        <div className="rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)]">
          <div className="flex items-center justify-between border-b border-[var(--rule-soft)] px-4 py-2.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
              {files.length} {files.length === 1 ? "file" : "files"}
            </span>
          </div>
          <ul className="px-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(files as any[]).map((file) => (
              <FileRow
                key={file.uploadedAt}
                file={file}
                caseId={caseId}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button asChild variant="outline">
          <a href={`/portal/${caseId}/upload`}>Open debtor upload portal</a>
        </Button>
      </div>
    </div>
  );
}
