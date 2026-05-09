"use client";

import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCaseStore } from "@/state/case-store";

export function ImportExport({ caseId }: { caseId?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const onExport = () => {
    if (!caseId) return;
    const json = useCaseStore.getState().exportCase(caseId);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `case-${caseId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const id = useCaseStore.getState().importCase(text);
      router.push(`/case/${id}`);
    } catch {
      alert("Could not parse the case file.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {caseId ? (
        <Button size="sm" variant="ghost" onClick={onExport}>
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-3.5 w-3.5" />
        Import JSON
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onImport}
      />
    </div>
  );
}
