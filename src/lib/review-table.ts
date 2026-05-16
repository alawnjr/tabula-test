// Types + helpers for the tabular-review ("matrix") extraction grid.
// The table is persisted under the Convex case's data.reviewTable key.

export type CellStatus = "idle" | "running" | "done" | "error";

export type Cell = {
  value: string;
  status: CellStatus;
  error?: string;
};

export type Column = {
  id: string;
  name: string;
  prompt: string;
};

export type Row = {
  id: string;
  fileName: string;
  storageId: string;
  mimeType: string;
  cells: Record<string, Cell>; // keyed by column id
};

export type ReviewTable = {
  columns: Column[];
  rows: Row[];
};

export const EMPTY_TABLE: ReviewTable = { columns: [], rows: [] };

export function emptyCell(): Cell {
  return { value: "", status: "idle" };
}

// Convex returns `v.any()`; normalize whatever comes back into a safe shape.
export function normalizeTable(raw: unknown): ReviewTable {
  if (!raw || typeof raw !== "object") return { columns: [], rows: [] };
  const r = raw as Partial<ReviewTable>;
  return {
    columns: Array.isArray(r.columns) ? r.columns : [],
    rows: Array.isArray(r.rows) ? r.rows : [],
  };
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

// Plain-text snapshot of the grid fed to the chat assistant as case context.
export function buildTableContext(table: ReviewTable): string {
  const lines: string[] = [
    "TABULAR REVIEW GRID",
    `${table.rows.length} document(s) × ${table.columns.length} extraction column(s).`,
    "",
    "COLUMNS (name — what it extracts):",
  ];
  if (table.columns.length === 0) lines.push("  (none defined yet)");
  for (const c of table.columns) {
    lines.push(`  • ${c.name}: ${c.prompt || "(no prompt set)"}`);
  }
  lines.push("", "EXTRACTED DATA BY DOCUMENT:");
  if (table.rows.length === 0) lines.push("  (no files added yet)");
  for (const row of table.rows) {
    lines.push(`\n[${row.fileName}]`);
    for (const c of table.columns) {
      const cell = row.cells[c.id];
      const v =
        cell && cell.value && cell.status === "done"
          ? cell.value
          : cell?.status === "running"
          ? "(extracting…)"
          : cell?.status === "error"
          ? `(error: ${cell.error ?? "failed"})`
          : "(not run)";
      lines.push(`  ${c.name}: ${v}`);
    }
  }
  return lines.join("\n");
}
