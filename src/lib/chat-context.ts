import type { CaseRecord } from "@/state/case-store";
import { FORM_ORDER, getSchema, chapterLabel } from "@/lib/schemas";

export function buildCaseContext(record: CaseRecord): string {
  const { chapter, debtorName, forms } = record;

  const lines: string[] = [
    `Case type: ${chapterLabel(chapter)}`,
    `Client name: ${debtorName || "Not yet provided"}`,
    `Case ID: ${record.id}`,
    "",
    "CASE DATA (filled fields only):",
  ];

  const formIds = FORM_ORDER[chapter] ?? [];

  for (const formId of formIds) {
    const schema = getSchema(formId);
    if (!schema) continue;

    const formData = forms[formId];
    if (!formData || Object.keys(formData).length === 0) continue;

    lines.push(`\n[${schema.title}]`);

    for (const section of schema.sections) {
      const sectionLines: string[] = [];

      for (const item of section.items) {
        if (item.kind === "repeating-group") {
          const groups = formData[item.id];
          if (Array.isArray(groups) && groups.length > 0) {
            sectionLines.push(`  ${item.label}: ${groups.length} entr${groups.length === 1 ? "y" : "ies"}`);
          }
        } else {
          const val = formData[item.id];
          if (val === undefined || val === null || val === "") continue;

          let displayVal = String(val);
          if ((item.type === "select" || item.type === "radio") && item.options) {
            const opt = item.options.find((o) => o.value === String(val));
            if (opt) displayVal = opt.label;
          }
          sectionLines.push(`  ${item.label}: ${displayVal}`);
        }
      }

      if (sectionLines.length > 0) {
        lines.push(`  — ${section.title}`);
        lines.push(...sectionLines);
      }
    }
  }

  return lines.join("\n");
}
