import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChartFrameProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ChartFrame({
  title,
  subtitle,
  actions,
  footer,
  children,
  className,
  ...props
}: ChartFrameProps) {
  return (
    <section className={cn("chart-frame", className)} {...props}>
      {(title || subtitle || actions) ? (
        <header className="relative flex flex-col gap-3 border-b border-border/70 px-5 py-3.5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title ? <h3 className="text-lg font-medium tracking-tight text-ink">{title}</h3> : null}
            {subtitle ? <p className="text-body-sm text-ink-muted">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}

      <div className="chart-surface">{children}</div>

      {footer ? (
        <footer className="relative border-t border-border/70 px-5 py-3 text-body-sm text-ink-subtle">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
