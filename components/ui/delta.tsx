import * as React from "react";
import { cn } from "@/lib/utils";

export interface DeltaProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Signed numeric value. Positive = gain, negative = loss, 0 = flat. */
  value: number;
  /** Render as percent (default), absolute change, or both. */
  format?: "pct" | "abs" | "both";
  /** Absolute change value, only used when format is "abs" or "both". */
  absoluteChange?: number;
  /** Size variant. */
  size?: "sm" | "md" | "lg";
  /** Hide the directional glyph. */
  hideGlyph?: boolean;
}

const sizeClasses = {
  sm: "gap-0.5 text-xs",
  md: "gap-1 text-sm",
  lg: "gap-1 text-base",
};

const glyphSize = { sm: "h-2 w-2", md: "h-2.5 w-2.5", lg: "h-3 w-3" };

function DeltaGlyph({
  direction,
  className,
}: {
  direction: "up" | "down" | "flat";
  className?: string;
}) {
  if (direction === "flat") {
    return (
      <svg
        viewBox="0 0 8 8"
        aria-hidden
        className={className}
        fill="currentColor"
      >
        <rect x="1" y="3.5" width="6" height="1" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 8 8"
      aria-hidden
      className={cn(className, direction === "down" && "rotate-180")}
      fill="currentColor"
    >
      <path d="M4 0 L8 7 L0 7 Z" />
    </svg>
  );
}

export function Delta({
  value,
  format = "pct",
  absoluteChange,
  size = "md",
  hideGlyph,
  className,
  ...props
}: DeltaProps) {
  const direction: "up" | "down" | "flat" =
    value > 0 ? "up" : value < 0 ? "down" : "flat";

  const colorClass =
    direction === "up"
      ? "text-gain"
      : direction === "down"
        ? "text-loss"
        : "text-ink-muted";

  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  const pctText = `${sign}${value.toFixed(2)}%`;
  const absText =
    absoluteChange !== undefined
      ? `${absoluteChange > 0 ? "+" : ""}${absoluteChange.toFixed(2)}`
      : null;

  return (
    <span
      data-numeric
      className={cn(
        "inline-flex items-center font-medium tabular-nums",
        sizeClasses[size],
        colorClass,
        className
      )}
      {...props}
    >
      {!hideGlyph && (
        <DeltaGlyph direction={direction} className={glyphSize[size]} />
      )}
      {format === "pct" && <span>{pctText}</span>}
      {format === "abs" && absText && <span>{absText}</span>}
      {format === "both" && (
        <>
          {absText && <span>{absText}</span>}
          <span className="mx-0.5 text-ink-muted">/</span>
          <span>{pctText}</span>
        </>
      )}
    </span>
  );
}
