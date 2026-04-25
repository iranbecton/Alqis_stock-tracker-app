import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  meta?: React.ReactNode;
  variant?: "default" | "compact" | "panel";
}

export function EmptyState({
  icon = <Inbox className="h-5 w-5" />,
  title,
  description,
  action,
  meta,
  variant = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-4 text-left",
        variant === "default" &&
          "rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-elevated/60 px-5 py-6",
        variant === "compact" && "gap-3",
        variant === "panel" &&
          "rounded-[var(--radius-xl)] border border-border/70 bg-surface p-6 card-highlight",
        className
      )}
      {...props}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface-strong text-ink-muted">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium tracking-tight text-ink">{title}</h3>
        {description ? <p className="text-body text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
      {meta ? <div className="text-body-sm text-ink-subtle">{meta}</div> : null}
    </div>
  );
}
