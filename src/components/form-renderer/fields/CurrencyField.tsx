"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency, parseCurrency } from "@/lib/currency";

function display(value: number | string | undefined): string {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value === 0 ? "" : formatCurrency(value);
  }
  if (typeof value === "string" && value !== "") return value;
  return "";
}

export function CurrencyField({
  value,
  onChange,
  id,
}: {
  value: number | string | undefined;
  onChange: (v: number) => void;
  id?: string;
}) {
  const externalDisplay = display(value);
  const [draft, setDraft] = useState(externalDisplay);
  const [lastExternal, setLastExternal] = useState(externalDisplay);

  // React-blessed pattern: sync draft to external prop changes during render.
  if (externalDisplay !== lastExternal) {
    setLastExternal(externalDisplay);
    setDraft(externalDisplay);
  }

  return (
    <Input
      id={id}
      inputMode="decimal"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = parseCurrency(draft);
        onChange(n);
        const next = n === 0 ? "" : formatCurrency(n);
        setDraft(next);
        setLastExternal(next);
      }}
      onFocus={() => {
        if (typeof value === "number" && value !== 0) setDraft(String(value));
      }}
      placeholder="$0.00"
    />
  );
}
