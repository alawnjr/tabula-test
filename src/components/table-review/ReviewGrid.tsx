"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Play,
  Plus,
  Trash2,
  Settings2,
  Loader2,
  ExternalLink,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type ReviewTable,
  type Column,
  type Row,
  type Cell,
  emptyCell,
  normalizeTable,
  newId,
} from "@/lib/review-table";

const COL_W = "min-w-[240px] w-[240px]";

function FileLink({ caseId, storageId }: { caseId: string; storageId: string }) {
  const url = useQuery(api.cases.reviewFileUrl, {
    id: caseId as Id<"cases">,
    storageId,
  });
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--mute)] hover:text-[var(--ink)]"
      aria-label="View source file"
      title="View source file"
    >
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function ReviewGrid({
  caseId,
  onTableChange,
}: {
  caseId: string;
  onTableChange?: (t: ReviewTable) => void;
}) {
  const serverTable = useQuery(api.cases.getReviewTable, {
    id: caseId as Id<"cases">,
  });
  const saveTable = useMutation(api.cases.saveReviewTable);
  const generateUploadUrl = useMutation(api.cases.generateUploadUrl);
  const extractField = useAction(api.extract.extractField);

  const [table, setTable] = useState<ReviewTable | null>(null);
  const hydrated = useRef(false);
  const tableRef = useRef<ReviewTable>({ columns: [], rows: [] });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate once from the server, then this component owns the state.
  useEffect(() => {
    if (hydrated.current || serverTable === undefined) return;
    hydrated.current = true;
    setTable(normalizeTable(serverTable));
  }, [serverTable]);

  useEffect(() => {
    if (table) {
      tableRef.current = table;
      onTableChange?.(table);
    }
  }, [table, onTableChange]);

  const commit = useCallback(
    (next: ReviewTable) => {
      tableRef.current = next;
      setTable(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void saveTable({ id: caseId as Id<"cases">, table: next });
      }, 800);
    },
    [caseId, saveTable]
  );

  const cellOf = (row: Row, colId: string): Cell =>
    row.cells[colId] ?? emptyCell();

  // ---- structural edits ---------------------------------------------------
  const [editingCol, setEditingCol] = useState<string | null>(null);

  const addColumn = () => {
    const col: Column = { id: newId("col"), name: "New column", prompt: "" };
    commit({ ...tableRef.current, columns: [...tableRef.current.columns, col] });
    setEditingCol(col.id);
  };

  const updateColumn = (colId: string, patch: Partial<Column>) => {
    commit({
      ...tableRef.current,
      columns: tableRef.current.columns.map((c) =>
        c.id === colId ? { ...c, ...patch } : c
      ),
    });
  };

  const deleteColumn = (colId: string) => {
    const t = tableRef.current;
    commit({
      columns: t.columns.filter((c) => c.id !== colId),
      rows: t.rows.map((r) => {
        const cells = { ...r.cells };
        delete cells[colId];
        return { ...r, cells };
      }),
    });
    setEditingCol(null);
  };

  const deleteRow = (rowId: string) => {
    commit({
      ...tableRef.current,
      rows: tableRef.current.rows.filter((r) => r.id !== rowId),
    });
  };

  const setCell = (rowId: string, colId: string, cell: Cell) => {
    commit({
      ...tableRef.current,
      rows: tableRef.current.rows.map((r) =>
        r.id === rowId
          ? { ...r, cells: { ...r.cells, [colId]: cell } }
          : r
      ),
    });
  };

  // ---- file upload --------------------------------------------------------
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const postUrl = await generateUploadUrl();
        const res = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = (await res.json()) as { storageId: string };
        const row: Row = {
          id: newId("row"),
          fileName: file.name,
          storageId,
          mimeType: file.type,
          cells: {},
        };
        commit({ ...tableRef.current, rows: [...tableRef.current.rows, row] });
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  // ---- run extraction -----------------------------------------------------
  const [running, setRunning] = useState(false);

  const runPairs = useCallback(
    async (pairs: { rowId: string; colId: string }[]) => {
      if (running || pairs.length === 0) return;
      setRunning(true);
      try {
        for (const { rowId, colId } of pairs) {
          const t = tableRef.current;
          const row = t.rows.find((r) => r.id === rowId);
          const col = t.columns.find((c) => c.id === colId);
          if (!row || !col || !col.prompt.trim()) continue;

          setCell(rowId, colId, {
            ...(row.cells[colId] ?? emptyCell()),
            status: "running",
          });
          try {
            const { value } = await extractField({
              storageId: row.storageId as Id<"_storage">,
              columnName: col.name,
              prompt: col.prompt,
              filename: row.fileName,
              mimeType: row.mimeType || "application/pdf",
            });
            setCell(rowId, colId, { value, status: "done" });
          } catch (err) {
            setCell(rowId, colId, {
              value: "",
              status: "error",
              error: err instanceof Error ? err.message : "Extraction failed",
            });
          }
        }
      } finally {
        setRunning(false);
      }
    },
    // setCell/extractField are stable enough; tableRef gives fresh data
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [running, extractField]
  );

  const runAll = () =>
    runPairs(
      tableRef.current.rows.flatMap((r) =>
        tableRef.current.columns.map((c) => ({ rowId: r.id, colId: c.id }))
      )
    );
  const runRow = (rowId: string) =>
    runPairs(tableRef.current.columns.map((c) => ({ rowId, colId: c.id })));
  const runColumn = (colId: string) =>
    runPairs(tableRef.current.rows.map((r) => ({ rowId: r.id, colId })));

  if (table === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--mute)]">
          Loading grid…
        </p>
      </div>
    );
  }

  const hasRows = table.rows.length > 0;
  const hasCols = table.columns.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--rule-soft)] px-5 py-3">
        <div className="mr-auto">
          <span className="tag">Tabular review</span>
          <h1
            className="text-[19px] leading-tight tracking-[-0.02em] text-[var(--ink)]"
            style={{ fontFamily: "var(--serif)" }}
          >
            Extraction grid
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Add file
        </Button>
        <Button variant="outline" size="sm" onClick={addColumn}>
          <Plus className="h-3.5 w-3.5" />
          Add column
        </Button>
        <Button
          size="sm"
          onClick={runAll}
          disabled={running || !hasRows || !hasCols}
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Run all
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="border-separate border-spacing-0 text-[13px]">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 min-w-[220px] w-[220px] border-b border-r border-[var(--rule)] bg-[var(--paper-3)] px-3 py-2 text-left">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
                  Document
                </span>
              </th>
              {table.columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    COL_W,
                    "relative border-b border-r border-[var(--rule)] bg-[var(--paper-3)] px-3 py-2 text-left align-top"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="truncate text-[13px] tracking-[-0.01em] text-[var(--ink)]"
                        style={{ fontFamily: "var(--serif)" }}
                      >
                        {col.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-[var(--mute)]">
                        {col.prompt || "No prompt — click the gear to set one"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => runColumn(col.id)}
                        disabled={running || !hasRows || !col.prompt.trim()}
                        className="rounded p-1 text-[var(--mute)] hover:text-[var(--ink)] disabled:opacity-30"
                        title="Run this column"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingCol(editingCol === col.id ? null : col.id)
                        }
                        className="rounded p-1 text-[var(--mute)] hover:text-[var(--ink)]"
                        title="Edit column"
                      >
                        <Settings2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {editingCol === col.id && (
                    <ColumnEditor
                      col={col}
                      onChange={(p) => updateColumn(col.id, p)}
                      onDelete={() => deleteColumn(col.id)}
                      onClose={() => setEditingCol(null)}
                    />
                  )}
                </th>
              ))}
              <th className="border-b border-[var(--rule)] bg-[var(--paper-3)] px-2 py-2">
                <button
                  type="button"
                  onClick={addColumn}
                  className="flex items-center gap-1 whitespace-nowrap rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                >
                  <Plus className="h-3 w-3" /> Column
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.id} className="group">
                <td className="sticky left-0 z-10 min-w-[220px] w-[220px] border-b border-r border-[var(--rule-soft)] bg-[var(--paper-2)] px-3 py-2 align-top">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="truncate text-[13px] tracking-[-0.01em] text-[var(--ink)]"
                        style={{ fontFamily: "var(--serif)" }}
                        title={row.fileName}
                      >
                        {row.fileName}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <FileLink caseId={caseId} storageId={row.storageId} />
                        <button
                          type="button"
                          onClick={() => runRow(row.id)}
                          disabled={running || !hasCols}
                          className="text-[var(--mute)] hover:text-[var(--ink)] disabled:opacity-30"
                          title="Run this row"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRow(row.id)}
                          className="text-[var(--mute)] hover:text-[var(--destructive)]"
                          title="Remove file"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                {table.columns.map((col) => (
                  <CellView
                    key={col.id}
                    cell={cellOf(row, col.id)}
                    onSave={(value) =>
                      setCell(row.id, col.id, { value, status: "done" })
                    }
                  />
                ))}
                <td className="border-b border-[var(--rule-soft)] bg-[var(--paper)]" />
              </tr>
            ))}

            <tr>
              <td className="sticky left-0 z-10 border-r border-[var(--rule-soft)] bg-[var(--paper-2)] px-3 py-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1 whitespace-nowrap rounded px-1 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)] hover:text-[var(--ink)] disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" /> Add file
                </button>
              </td>
              <td
                colSpan={table.columns.length + 1}
                className="bg-[var(--paper)]"
              />
            </tr>
          </tbody>
        </table>

        {!hasRows && !hasCols && (
          <div className="m-6 rounded-[3px] border border-dashed border-[var(--rule)] bg-[var(--paper-2)] px-6 py-12 text-center">
            <p
              className="text-[15px] tracking-[-0.01em] text-[var(--ink-2)]"
              style={{ fontFamily: "var(--serif)" }}
            >
              <em>Build your extraction grid.</em>
            </p>
            <p className="mx-auto mt-1.5 max-w-[46ch] text-[12px] text-[var(--mute)]">
              Add a column for each fact you want pulled (give it a name and a
              prompt), add a file for each document, then Run all.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ColumnEditor({
  col,
  onChange,
  onDelete,
  onClose,
}: {
  col: Column;
  onChange: (p: Partial<Column>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute left-2 top-full z-40 mt-1 w-[300px] rounded-[4px] border border-[var(--rule)] bg-[var(--paper)] p-3 shadow-lg">
      <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
        Column name
      </label>
      <input
        autoFocus
        value={col.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className="mt-1 w-full rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)] px-2 py-1.5 text-[13px] text-[var(--ink)] outline-none focus:ring-1 focus:ring-[var(--accent-deep)]"
      />
      <label className="mt-3 block font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)]">
        Extraction prompt
      </label>
      <textarea
        value={col.prompt}
        onChange={(e) => onChange({ prompt: e.target.value })}
        rows={4}
        placeholder="e.g. The total amount due, as a number with no currency symbol"
        className="mt-1 w-full resize-none rounded-[3px] border border-[var(--rule)] bg-[var(--paper-2)] px-2 py-1.5 text-[12.5px] leading-relaxed text-[var(--ink)] outline-none placeholder:text-[var(--mute)] focus:ring-1 focus:ring-[var(--accent-deep)]"
      />
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mute)] hover:text-[var(--destructive)]"
        >
          <Trash2 className="h-3 w-3" /> Delete
        </button>
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

function CellView({
  cell,
  onSave,
}: {
  cell: Cell;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cell.value);

  const startEdit = () => {
    setDraft(cell.value);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (draft !== cell.value) onSave(draft);
  };

  return (
    <td
      className={cn(
        COL_W,
        "border-b border-r border-[var(--rule-soft)] bg-[var(--paper)] align-top"
      )}
    >
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              setDraft(cell.value);
              setEditing(false);
            }
          }}
          rows={3}
          className="w-full resize-none bg-[var(--paper)] px-3 py-2 text-[13px] leading-relaxed text-[var(--ink)] outline-none ring-1 ring-inset ring-[var(--accent-deep)]"
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          disabled={cell.status === "running"}
          className="flex min-h-[40px] w-full items-start gap-1.5 px-3 py-2 text-left hover:bg-[var(--paper-2)]"
        >
          {cell.status === "running" ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--mute)]">
              <Loader2 className="h-3 w-3 animate-spin" /> Extracting…
            </span>
          ) : cell.status === "error" ? (
            <span className="inline-flex items-start gap-1.5 text-[12px] text-[var(--destructive)]">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              {cell.error ?? "Extraction failed"}
            </span>
          ) : cell.value ? (
            <span className="flex items-start gap-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--ink)]">
              {cell.status === "done" && (
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-[var(--accent-deep)]" />
              )}
              {cell.value}
            </span>
          ) : (
            <span className="text-[12px] italic text-[var(--mute)]">
              Click to edit
            </span>
          )}
        </button>
      )}
    </td>
  );
}
