"use client";

import { Select } from "@/components/ui/select";
import type { Option } from "@/lib/schemas/types";

export function SelectField({
  value,
  onChange,
  options,
  id,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: Option[];
  id?: string;
}) {
  return (
    <Select
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select…</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
