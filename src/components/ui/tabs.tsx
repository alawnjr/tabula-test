"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Ctx = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = React.createContext<Ctx | null>(null);

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? value! : internal;
  const setValue = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "relative flex items-end gap-0 overflow-x-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  index,
  className,
  indicator,
}: {
  value: string;
  children: React.ReactNode;
  index?: number;
  className?: string;
  indicator?: React.ReactNode;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be inside Tabs");
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "group relative -mb-px inline-flex shrink-0 items-baseline gap-2 px-3 py-2 transition-colors",
        active
          ? "text-[var(--ink)]"
          : "text-[var(--mute)] hover:text-[var(--ink-2)]",
        className
      )}
    >
      {typeof index === "number" ? (
        <span
          className={cn(
            "font-mono text-[9px] tracking-[0.1em] tabular-nums",
            active
              ? "font-semibold text-[var(--accent-deep)]"
              : "text-[var(--mute)]"
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      ) : null}
      <span
        className="text-[12.5px] tracking-[-0.01em] whitespace-nowrap"
        style={{ fontFamily: "var(--serif)" }}
      >
        {children}
      </span>
      {indicator}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-1 -bottom-px h-px",
          active ? "bg-[var(--ink)]" : "bg-transparent"
        )}
      />
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be inside Tabs");
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
