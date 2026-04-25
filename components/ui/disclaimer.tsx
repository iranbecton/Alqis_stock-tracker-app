import * as React from "react";
import { cn } from "@/lib/utils";

const DEFAULT_COPY =
  "ALQIS explanations are informational only and do not constitute investment advice.";

export interface DisclaimerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "inline" | "banner";
  copy?: string;
}

/**
 * Compliance disclaimer. Required on every stock page and every
 * explanation card. Do not remove. Do not edit copy without legal review.
 */
export function Disclaimer({
  variant = "inline",
  copy = DEFAULT_COPY,
  className,
  ...props
}: DisclaimerProps) {
  if (variant === "banner") {
    return (
      <div
        role="note"
        className={cn(
          "flex w-full items-start gap-2.5 rounded-[var(--radius-lg)] border border-border/70",
          "bg-[color-mix(in_srgb,var(--surface-elevated)_84%,var(--accent-ai)_6%)] px-4 py-3",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
          className
        )}
        {...props}
      >
        <span
          aria-hidden
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-warn/55 bg-warn-bg/35 text-warn text-[10px] font-semibold"
        >
          i
        </span>
        <p className="text-[12px] leading-5 text-ink-muted">{copy}</p>
      </div>
    );
  }

  return (
    <p
      role="note"
      className={cn(
        "text-[11.5px] leading-5 text-ink-muted/90",
        className
      )}
      {...props}
    >
      {copy}
    </p>
  );
}
