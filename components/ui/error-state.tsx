import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "banner" | "panel";
}

export function ErrorState({
  title = "Something needs attention",
  description = "The data did not load as expected. Try again or return to the previous view.",
  action,
  variant = "panel",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-4 border text-left",
        variant === "banner" &&
          "items-start rounded-[var(--radius-md)] border-danger/20 bg-danger-muted px-4 py-3",
        variant === "panel" &&
          "items-start rounded-[var(--radius-lg)] border-danger/20 bg-[linear-gradient(180deg,rgba(68,19,25,0.34)_0%,rgba(24,14,19,0.78)_100%)] p-5",
        className
      )}
      {...props}
    >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-danger/20 bg-danger-muted text-danger">
        <AlertTriangle className="h-[1.125rem] w-[1.125rem]" />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <h3 className="text-base font-medium tracking-tight text-ink">{title}</h3>
        {description ? <p className="text-body text-ink-muted">{description}</p> : null}
        {action ? <div className="w-full pt-1">{action}</div> : null}
      </div>
    </div>
  );
}
