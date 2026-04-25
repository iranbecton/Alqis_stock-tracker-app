import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative overflow-hidden border text-ink card-highlight",
  {
    variants: {
      variant: {
        default:
          "border-border/80 bg-[color-mix(in_srgb,var(--surface)_88%,var(--background)_12%)]",
        elevated:
          "border-border/80 bg-[color-mix(in_srgb,var(--surface-elevated)_84%,var(--surface-alt)_16%)] shadow-elevation-3",
        subtle:
          "border-border/68 bg-[color-mix(in_srgb,var(--surface-elevated)_74%,var(--surface)_26%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_10px_26px_rgba(2,6,10,0.14)]",
        interactive:
          "border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_78%,var(--surface)_22%)] interactive-panel hover:bg-surface-strong",
        critical: "border-danger/20 bg-danger-muted/40",
        flat: "border-transparent bg-transparent shadow-none backdrop-blur-none",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      radius: {
        md: "rounded-[var(--radius-md)]",
        lg: "rounded-[var(--radius-lg)]",
        xl: "rounded-[var(--radius-xl)]",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      radius: "lg",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, radius, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, radius }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mb-5 flex flex-col gap-2", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardEyebrow = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("section-kicker inline-flex items-center gap-2", className)}
    {...props}
  />
));
CardEyebrow.displayName = "CardEyebrow";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-card-title font-serif text-ink", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-body text-ink-muted", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-5 flex items-center justify-between gap-3 border-t border-border/70 pt-4",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
