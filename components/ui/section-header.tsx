import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  align?: "start" | "center";
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  align = "start",
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:items-end md:text-left",
        className
      )}
      {...props}
    >
      <div className="min-w-0 space-y-3">
        {eyebrow ? <div className="section-kicker">{eyebrow}</div> : null}
        <div className="space-y-2">
          <h2 className="section-title font-serif">{title}</h2>
          {description ? <p className="section-copy">{description}</p> : null}
        </div>
      </div>

      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
