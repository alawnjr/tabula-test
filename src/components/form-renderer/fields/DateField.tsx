"use client";

import { Input } from "@/components/ui/input";

export function DateField({
  value,
  onChange,
  id,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  id?: string;
}) {
  return (
    <Input
      id={id}
      type="date"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
