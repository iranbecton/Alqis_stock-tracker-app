import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap select-none rounded-[var(--radius-md)]",
    "font-medium tracking-tight",
    "transition-[background-color,border-color,color,transform,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
    "active:translate-y-px",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "border border-transparent bg-accent text-bg shadow-[0_10px_24px_color-mix(in_srgb,var(--accent-primary)_18%,transparent)] hover:bg-accent-hover",
        secondary:
          "border border-border bg-surface-elevated text-ink hover:border-border-strong hover:bg-surface-strong",
        quiet:
          "border border-transparent bg-transparent text-ink-muted hover:bg-surface-elevated hover:text-ink",
        ghost:
          "border border-transparent bg-transparent text-ink-subtle hover:bg-surface hover:text-ink",
        danger:
          "border border-danger/20 bg-danger-muted text-danger hover:border-danger/30 hover:bg-danger-muted/80",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-[1.125rem] text-sm",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
