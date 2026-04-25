import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva("skeleton-shimmer bg-surface-strong/80", {
  variants: {
    shape: {
      rect: "rounded-[var(--radius-sm)]",
      text: "h-4 rounded-sm",
      circle: "rounded-full",
    },
    tone: {
      default: "bg-surface-strong/80",
      subtle: "bg-surface-elevated/80",
    },
  },
  defaultVariants: {
    shape: "rect",
    tone: "default",
  },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({
  shape,
  tone,
  className,
  ...props
}: SkeletonProps) {
  return <div aria-hidden className={cn(skeletonVariants({ shape, tone }), className)} {...props} />;
}

export function ExplanationSkeleton() {
  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-border/70 bg-surface p-6 card-highlight">
      <div className="flex items-center justify-between gap-3">
        <Skeleton shape="text" className="w-28" />
        <Skeleton shape="text" className="w-20" />
      </div>
      <Skeleton shape="text" className="h-5 w-full" />
      <Skeleton shape="text" className="h-5 w-4/5" />
      <div className="space-y-2 pt-2">
        <Skeleton shape="text" className="w-full" />
        <Skeleton shape="text" className="w-5/6" />
        <Skeleton shape="text" className="w-3/4" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-5 rounded-[var(--radius-lg)] border border-border/70 bg-surface-elevated p-5 card-highlight">
      <div className="space-y-2">
        <Skeleton shape="text" className="w-24" />
        <Skeleton shape="text" className="h-6 w-2/3" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}
