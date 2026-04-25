import * as React from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("page-container", className)} {...props} />;
}

export function PageShell({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("page-shell", className)} {...props} />;
}

export function PageSection({
  dense = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { dense?: boolean }) {
  return (
    <section
      className={cn(dense ? "page-section-tight" : "page-section", className)}
      {...props}
    />
  );
}

export function PanelGrid({
  columns = 2,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { columns?: 2 | 3 }) {
  return (
    <div
      className={cn(
        "panel-grid",
        columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3",
        className
      )}
      {...props}
    />
  );
}
