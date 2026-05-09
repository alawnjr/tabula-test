import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[2px] px-1.5 py-[1px] font-mono text-[9.5px] uppercase tracking-[0.1em]",
  {
    variants: {
      variant: {
        default:
          "border border-[var(--rule)] bg-[var(--paper)] text-[var(--ink-2)]",
        secondary:
          "border border-[var(--rule)] bg-[var(--chip)] text-[var(--ink-2)]",
        outline: "border border-[var(--rule)] text-[var(--ink-2)]",
        accent: "bg-[var(--accent-bg)] text-[var(--accent-ink)]",
        ink: "bg-[var(--ink)] text-[var(--paper)]",
        deep: "bg-[var(--accent-deep)] text-[var(--paper)]",
        success: "bg-[var(--accent-bg)] text-[var(--accent-ink)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      style={{ fontFamily: "var(--mono)" }}
      {...props}
    />
  );
}
