"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Option } from "@/lib/schemas/types";

export function RadioField({
  value,
  onChange,
  options,
  id,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: Option[];
  id: string;
}) {
  return (
    <RadioGroup value={value ?? ""} onValueChange={onChange} className="gap-2">
      {options.map((o) => {
        const optId = `${id}-${o.value}`;
        return (
          <div key={o.value} className="flex items-center gap-2">
            <RadioGroupItem id={optId} value={o.value} />
            <Label htmlFor={optId} className="font-normal">
              {o.label}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
