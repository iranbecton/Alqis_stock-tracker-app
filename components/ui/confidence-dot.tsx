import * as React from "react";
import { cn } from "@/lib/utils";

export type ConfidenceBand = "A" | "B" | "C" | "D";

export interface ConfidenceDotProps extends React.HTMLAttributes<HTMLDivElement> {
  band: ConfidenceBand;
  /** Show the text label alongside the dots. */
  showLabel?: boolean;
}

const bandMeta: Record<
  ConfidenceBand,
  { filled: number; label: string; color: string }
> = {
  A: { filled: 4, label: "High confidence", color: "bg-accent-ai" },
  B: { filled: 3, label: "Good confidence", color: "bg-accent" },
  C: { filled: 2, label: "Moderate confidence", color: "bg-warn" },
  D: { filled: 1, label: "Low confidence", color: "bg-loss" },
};

/**
 * Signal-strength-style confidence indicator. Four cells, filled in
 * proportion to the band. Reads more premium than a single colored pill
 * and scales visually with the information content.
 */
export function ConfidenceDot({
  band,
  showLabel = true,
  className,
  ...props
}: ConfidenceDotProps) {
  const { filled, label, color } = bandMeta[band];

  return (
    <div
      className={cn("inline-flex items-center gap-2", className)}
      aria-label={label}
      {...props}
    >
      <div className="flex items-end gap-0.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => {
          const isFilled = i < filled;
          const height = 4 + i * 2; // 4, 6, 8, 10 px
          return (
            <span
              key={i}
              className={cn(
                "w-1 rounded-sm transition-colors",
                isFilled ? color : "bg-border"
              )}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>
      {showLabel && (
        <span className="text-xs text-ink-muted tracking-label uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
