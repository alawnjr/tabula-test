"use client";

import { Input } from "@/components/ui/input";

export function NumberField({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: number | string | undefined;
  onChange: (v: number | "") => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <Input
      id={id}
      type="number"
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? "" : Number(v));
      }}
      placeholder={placeholder}
    />
  );
}
