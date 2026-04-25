import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium tracking-[0.12em] uppercase",
  {
    variants: {
      variant: {
        neutral: "border-border bg-surface-elevated text-ink-muted",
        accent: "border-accent/16 bg-accent-muted text-accent",
        ai: "border-accent-ai/18 bg-[color-mix(in_srgb,var(--accent-ai)_14%,transparent)] text-accent-ai",
        gain: "border-gain/15 bg-gain-muted text-gain",
        positive: "border-gain/15 bg-gain-muted text-gain",
        loss: "border-loss/15 bg-loss-muted text-loss",
        negative: "border-loss/15 bg-loss-muted text-loss",
        warn: "border-warn/15 bg-warn-muted text-warn",
        live: "border-border-strong bg-surface-strong text-ink",
        outline: "border-border bg-transparent text-ink-muted",
      },
      size: {
        sm: "h-6 px-2.5 text-[11px]",
        md: "h-7 px-3 text-xs",
        lg: "h-8 px-3.5 text-sm tracking-[0.08em]",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "sm",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
