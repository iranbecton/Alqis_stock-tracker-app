import * as React from "react";
import { cn } from "@/lib/utils";
import { Delta } from "./delta";

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  /** Optional delta percentage (e.g. 3.82 for +3.82%). */
  delta?: number;
  /** Stack orientation. */
  orientation?: "vertical" | "horizontal";
  /** Emphasis — "lg" bumps the value to display size. */
  emphasis?: "default" | "lg";
}

export function Stat({
  label,
  value,
  delta,
  orientation = "vertical",
  emphasis = "default",
  className,
  ...props
}: StatProps) {
  const valueSizeClass =
    emphasis === "lg"
      ? "text-4xl font-medium"
      : "text-lg font-medium";

  return (
    <div
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-1"
          : "flex items-baseline justify-between gap-3",
        className
      )}
      {...props}
    >
      <span className="text-xs text-ink-muted tracking-label uppercase">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span
          className={cn("text-ink tabular-nums leading-none", valueSizeClass)}
          data-numeric
        >
          {value}
        </span>
        {typeof delta === "number" && <Delta value={delta} size="sm" />}
      </div>
    </div>
  );
}
