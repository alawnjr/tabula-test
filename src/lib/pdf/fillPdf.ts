import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from "pdf-lib";

export type FieldMap = Record<string, string | boolean | number | undefined | null>;

export async function fillPdf(templateUrl: string, fields: FieldMap): Promise<Uint8Array> {
  const res = await fetch(templateUrl);
  const bytes = await res.arrayBuffer();
  const doc = await PDFDocument.load(new Uint8Array(bytes));
  const form = doc.getForm();

  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    try {
      const field = form.getField(name);
      if (field instanceof PDFTextField) {
        field.setText(String(value));
        field.enableReadOnly();
      } else if (field instanceof PDFCheckBox) {
        if (value) field.check();
        else field.uncheck();
      } else if (field instanceof PDFDropdown) {
        const options = field.getOptions();
        const strVal = String(value);
        if (options.includes(strVal)) field.select(strVal);
      } else if (field instanceof PDFRadioGroup) {
        field.select(String(value));
      }
    } catch {
      // field not found or wrong type — skip silently
    }
  }

  return doc.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function fmtCurrency(v: unknown): string {
  const n = parseNum(v);
  if (n === 0) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function sumGroup(items: unknown, field: string): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce<number>((acc, row) => {
    if (row && typeof row === "object") {
      return acc + parseNum((row as Record<string, unknown>)[field]);
    }
    return acc;
  }, 0);
}
