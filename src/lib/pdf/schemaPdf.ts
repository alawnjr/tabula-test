import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type {
  Field,
  FormSchema,
  Section,
  SectionItem,
} from "@/lib/schemas/types";
import { isRepeatingGroup } from "@/lib/schemas/types";
import type { CaseRecord, FormData } from "@/state/case-store";
import { fmtCurrency, parseNum } from "./fillPdf";

// Schema-driven PDF generator. Used for any FormSchema that does not have a
// dedicated official-PDF template under public/forms. Produces a clean,
// printable document with the form's sections, labels and values.

const PAGE = { width: 612, height: 792 }; // US Letter
const MARGIN = { left: 54, right: 54, top: 60, bottom: 60 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;
const LABEL_WIDTH = 250;
const VALUE_X = MARGIN.left + LABEL_WIDTH + 8;
const VALUE_WIDTH = CONTENT_WIDTH - LABEL_WIDTH - 8;

// Resolve a select/radio value to its option label, otherwise pass through.
function fieldDisplay(field: Field, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (field.type === "currency") {
    const n = parseNum(value);
    if (n === 0) return "";
    return `$${fmtCurrency(n)}`;
  }
  if (field.type === "date") {
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  }
  if (field.type === "checkbox") {
    return value ? "Yes" : "No";
  }
  if ((field.type === "select" || field.type === "radio") && field.options) {
    const opt = field.options.find((o) => o.value === String(value));
    return opt?.label ?? String(value);
  }
  return String(value);
}

// Word-wrap text to fit a max width given font + size.
function wrapText(
  text: string,
  maxWidth: number,
  font: ReturnType<PDFDocument["embedFont"]> extends Promise<infer R> ? R : never,
  size: number
): string[] {
  if (!text) return [""];
  const paragraphs = String(text).split(/\r?\n/);
  const out: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const probe = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(probe, size);
      if (width <= maxWidth) {
        line = probe;
      } else {
        if (line) out.push(line);
        // Word longer than maxWidth — hard-break by char.
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          let chunk = "";
          for (const ch of word) {
            const next = chunk + ch;
            if (font.widthOfTextAtSize(next, size) > maxWidth) {
              out.push(chunk);
              chunk = ch;
            } else {
              chunk = next;
            }
          }
          line = chunk;
        } else {
          line = word;
        }
      }
    }
    if (line) out.push(line);
    if (paragraphs.length > 1) out.push("");
  }
  // Drop trailing empty line introduced by paragraph join.
  if (out.length && out[out.length - 1] === "") out.pop();
  return out.length ? out : [""];
}

type Cursor = {
  doc: PDFDocument;
  page: ReturnType<PDFDocument["addPage"]>;
  y: number;
  fontReg: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  fontBold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  fontItalic: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  pageNumber: number;
  headerTitle: string;
  headerSubtitle: string;
};

function newPage(c: Cursor): void {
  c.page = c.doc.addPage([PAGE.width, PAGE.height]);
  c.pageNumber += 1;
  c.y = PAGE.height - MARGIN.top;
  drawHeader(c);
}

function ensureSpace(c: Cursor, needed: number): void {
  if (c.y - needed < MARGIN.bottom) newPage(c);
}

function drawHeader(c: Cursor): void {
  c.page.drawText(c.headerTitle, {
    x: MARGIN.left,
    y: PAGE.height - 40,
    size: 9,
    font: c.fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  c.page.drawText(c.headerSubtitle, {
    x: MARGIN.left,
    y: PAGE.height - 52,
    size: 8,
    font: c.fontReg,
    color: rgb(0.35, 0.35, 0.35),
  });
  c.page.drawLine({
    start: { x: MARGIN.left, y: PAGE.height - 56 },
    end: { x: PAGE.width - MARGIN.right, y: PAGE.height - 56 },
    thickness: 0.5,
    color: rgb(0.4, 0.4, 0.4),
  });
  c.page.drawText(`Page ${c.pageNumber}`, {
    x: PAGE.width - MARGIN.right - 40,
    y: 36,
    size: 8,
    font: c.fontReg,
    color: rgb(0.45, 0.45, 0.45),
  });
  c.y = PAGE.height - MARGIN.top - 6;
}

function drawTitle(c: Cursor, title: string, longTitle: string): void {
  ensureSpace(c, 60);
  const titleLines = wrapText(title, CONTENT_WIDTH, c.fontBold, 16);
  for (const line of titleLines) {
    c.page.drawText(line, {
      x: MARGIN.left,
      y: c.y,
      size: 16,
      font: c.fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    c.y -= 20;
  }
  if (longTitle && longTitle !== title) {
    const subLines = wrapText(longTitle, CONTENT_WIDTH, c.fontItalic, 10);
    for (const line of subLines) {
      c.page.drawText(line, {
        x: MARGIN.left,
        y: c.y,
        size: 10,
        font: c.fontItalic,
        color: rgb(0.35, 0.35, 0.35),
      });
      c.y -= 13;
    }
  }
  c.y -= 6;
  c.page.drawLine({
    start: { x: MARGIN.left, y: c.y },
    end: { x: PAGE.width - MARGIN.right, y: c.y },
    thickness: 1,
    color: rgb(0.1, 0.1, 0.1),
  });
  c.y -= 14;
}

function drawSectionHeader(c: Cursor, section: Section): void {
  ensureSpace(c, 40);
  const lines = wrapText(section.title, CONTENT_WIDTH, c.fontBold, 12);
  for (const line of lines) {
    c.page.drawText(line, {
      x: MARGIN.left,
      y: c.y,
      size: 12,
      font: c.fontBold,
      color: rgb(0.08, 0.08, 0.08),
    });
    c.y -= 15;
  }
  if (section.description) {
    const descLines = wrapText(section.description, CONTENT_WIDTH, c.fontItalic, 9);
    for (const line of descLines) {
      ensureSpace(c, 12);
      c.page.drawText(line, {
        x: MARGIN.left,
        y: c.y,
        size: 9,
        font: c.fontItalic,
        color: rgb(0.4, 0.4, 0.4),
      });
      c.y -= 11;
    }
  }
  c.y -= 4;
  c.page.drawLine({
    start: { x: MARGIN.left, y: c.y },
    end: { x: PAGE.width - MARGIN.right, y: c.y },
    thickness: 0.4,
    color: rgb(0.6, 0.6, 0.6),
  });
  c.y -= 10;
}

function drawFieldRow(c: Cursor, label: string, value: string): void {
  const labelLines = wrapText(label, LABEL_WIDTH, c.fontReg, 9);
  const valueLines = wrapText(value || "—", VALUE_WIDTH, c.fontReg, 9);
  const lines = Math.max(labelLines.length, valueLines.length);
  const blockHeight = lines * 11 + 4;
  ensureSpace(c, blockHeight);

  const top = c.y;
  for (let i = 0; i < labelLines.length; i++) {
    c.page.drawText(labelLines[i], {
      x: MARGIN.left,
      y: top - i * 11,
      size: 9,
      font: c.fontReg,
      color: rgb(0.3, 0.3, 0.3),
    });
  }
  const empty = !value;
  for (let i = 0; i < valueLines.length; i++) {
    c.page.drawText(valueLines[i], {
      x: VALUE_X,
      y: top - i * 11,
      size: 9,
      font: empty ? c.fontItalic : c.fontReg,
      color: empty ? rgb(0.6, 0.6, 0.6) : rgb(0.05, 0.05, 0.05),
    });
  }
  c.y = top - lines * 11 - 3;
  c.page.drawLine({
    start: { x: MARGIN.left, y: c.y },
    end: { x: PAGE.width - MARGIN.right, y: c.y },
    thickness: 0.25,
    color: rgb(0.85, 0.85, 0.85),
  });
  c.y -= 5;
}

function drawTextarea(c: Cursor, label: string, value: string): void {
  const labelLines = wrapText(label, CONTENT_WIDTH, c.fontReg, 9);
  ensureSpace(c, 14);
  for (const line of labelLines) {
    c.page.drawText(line, {
      x: MARGIN.left,
      y: c.y,
      size: 9,
      font: c.fontReg,
      color: rgb(0.3, 0.3, 0.3),
    });
    c.y -= 11;
  }
  const valueLines = wrapText(value || "—", CONTENT_WIDTH - 12, c.fontReg, 9);
  const empty = !value;
  const boxHeight = Math.max(valueLines.length * 11 + 8, 28);
  ensureSpace(c, boxHeight + 4);

  c.page.drawRectangle({
    x: MARGIN.left,
    y: c.y - boxHeight,
    width: CONTENT_WIDTH,
    height: boxHeight,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.4,
    color: rgb(0.99, 0.99, 0.99),
  });
  let ty = c.y - 11;
  for (const line of valueLines) {
    c.page.drawText(line, {
      x: MARGIN.left + 6,
      y: ty,
      size: 9,
      font: empty ? c.fontItalic : c.fontReg,
      color: empty ? rgb(0.6, 0.6, 0.6) : rgb(0.05, 0.05, 0.05),
    });
    ty -= 11;
  }
  c.y -= boxHeight + 8;
}

function drawCheckboxLine(c: Cursor, label: string, checked: boolean): void {
  ensureSpace(c, 14);
  c.page.drawRectangle({
    x: MARGIN.left,
    y: c.y - 9,
    width: 9,
    height: 9,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 0.6,
  });
  if (checked) {
    c.page.drawText("X", {
      x: MARGIN.left + 1.5,
      y: c.y - 8,
      size: 9,
      font: c.fontBold,
      color: rgb(0, 0, 0),
    });
  }
  const lines = wrapText(label, CONTENT_WIDTH - 16, c.fontReg, 9);
  for (let i = 0; i < lines.length; i++) {
    ensureSpace(c, 12);
    c.page.drawText(lines[i], {
      x: MARGIN.left + 16,
      y: c.y - 1 - i * 11,
      size: 9,
      font: c.fontReg,
      color: rgb(0.1, 0.1, 0.1),
    });
  }
  c.y -= 12 + (lines.length - 1) * 11;
}

function drawField(c: Cursor, field: Field, data: FormData): void {
  // Visibility — match the FormRenderer rule.
  if (field.visibleIf) {
    const gating = data[field.visibleIf.fieldId];
    if (gating !== field.visibleIf.equals) return;
  }
  const raw = data[field.id];
  const label = field.required ? `${field.label} *` : field.label;
  if (field.type === "checkbox") {
    drawCheckboxLine(c, field.label, Boolean(raw));
    return;
  }
  if (field.type === "textarea") {
    drawTextarea(c, label, fieldDisplay(field, raw));
    return;
  }
  drawFieldRow(c, label, fieldDisplay(field, raw));
}

function drawRepeatingGroup(
  c: Cursor,
  group: Extract<SectionItem, { kind: "repeating-group" }>,
  data: FormData
): void {
  ensureSpace(c, 24);
  c.page.drawText(group.label, {
    x: MARGIN.left,
    y: c.y,
    size: 10,
    font: c.fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });
  c.y -= 13;
  if (group.description) {
    const lines = wrapText(group.description, CONTENT_WIDTH, c.fontItalic, 8.5);
    for (const line of lines) {
      ensureSpace(c, 12);
      c.page.drawText(line, {
        x: MARGIN.left,
        y: c.y,
        size: 8.5,
        font: c.fontItalic,
        color: rgb(0.45, 0.45, 0.45),
      });
      c.y -= 10;
    }
  }
  const items = Array.isArray(data[group.id])
    ? (data[group.id] as Record<string, unknown>[])
    : [];
  if (items.length === 0) {
    ensureSpace(c, 14);
    c.page.drawText("— none entered —", {
      x: MARGIN.left + 4,
      y: c.y,
      size: 9,
      font: c.fontItalic,
      color: rgb(0.55, 0.55, 0.55),
    });
    c.y -= 14;
    return;
  }
  items.forEach((item, idx) => {
    ensureSpace(c, 18);
    c.page.drawText(`${group.itemLabel} ${idx + 1}`, {
      x: MARGIN.left,
      y: c.y,
      size: 9.5,
      font: c.fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    c.y -= 11;
    const childData: FormData = item as FormData;
    for (const field of group.fields) {
      drawField(c, field, childData);
    }
    c.y -= 4;
  });
}

function drawSection(c: Cursor, section: Section, data: FormData): void {
  drawSectionHeader(c, section);
  for (const item of section.items) {
    if (isRepeatingGroup(item)) {
      drawRepeatingGroup(c, item, data);
    } else {
      drawField(c, item, data);
    }
  }
  c.y -= 10;
}

export async function generateSchemaPdf(
  schema: FormSchema,
  record: CaseRecord,
  formData: FormData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${schema.title} — ${record.debtorName || "Case"}`);
  doc.setProducer("Tabula");
  doc.setCreator("Tabula");

  const fontReg = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const subtitleParts = [
    record.debtorName,
    new Date().toLocaleDateString(),
    `Case ${record.id.slice(-8)}`,
  ].filter(Boolean);

  const cursor: Cursor = {
    doc,
    page: doc.addPage([PAGE.width, PAGE.height]),
    y: 0,
    fontReg,
    fontBold,
    fontItalic,
    pageNumber: 1,
    headerTitle: schema.longTitle,
    headerSubtitle: subtitleParts.join(" · "),
  };
  drawHeader(cursor);
  drawTitle(cursor, schema.title, schema.longTitle);

  for (const section of schema.sections) {
    drawSection(cursor, section, formData);
  }

  return doc.save();
}
