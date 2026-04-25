import * as React from "react";
import { cn } from "@/lib/utils";

export interface TickerProps extends React.HTMLAttributes<HTMLDivElement> {
  symbol: string;
  name?: string;
  /** Compact = inline, stacked = symbol above name. */
  layout?: "compact" | "stacked";
  /** Size variant. */
  size?: "sm" | "md" | "lg";
}

const symbolSize = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

const nameSize = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
};

export function Ticker({
  symbol,
  name,
  layout = "stacked",
  size = "md",
  className,
  ...props
}: TickerProps) {
  return (
    <div
      className={cn(
        layout === "stacked"
          ? "flex flex-col gap-0.5"
          : "flex items-baseline gap-2",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "font-semibold text-ink tracking-tight",
          symbolSize[size]
        )}
      >
        {symbol.toUpperCase()}
      </span>
      {name && (
        <span className={cn("text-ink-muted truncate", nameSize[size])}>
          {name}
        </span>
      )}
    </div>
  );
}
