"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] text-[12.5px] font-medium tracking-[-0.005em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-deep)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--paper)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--accent-deep)]",
        outline:
          "border border-[var(--rule)] bg-[var(--paper-2)] text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--paper)]",
        secondary:
          "bg-[var(--paper-3)] text-[var(--ink)] hover:bg-[color-mix(in_oklch,var(--ink)_8%,var(--paper-3))]",
        ghost:
          "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]",
        destructive:
          "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90",
        link: "text-[var(--ink)] underline underline-offset-4 decoration-[var(--rule)] hover:decoration-[var(--ink)]",
      },
      size: {
        default: "h-[30px] px-3 py-1.5",
        sm: "h-[26px] px-2.5 text-[11.5px]",
        lg: "h-9 px-5 text-[13px]",
        icon: "h-[30px] w-[30px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
