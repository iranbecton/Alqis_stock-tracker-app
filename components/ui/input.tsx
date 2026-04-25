import * as React from "react";
import { Search } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputShellVariants = cva(
  [
    "group relative flex w-full items-center rounded-[var(--radius-md)] border",
    "transition-[background-color,border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]",
    "focus-within:border-accent focus-within:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-primary)_24%,transparent)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-border bg-surface-elevated hover:border-border-strong",
        search:
          "border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_82%,#1a2331_18%)_0%,color-mix(in_srgb,var(--surface)_94%,#0a1018_6%)_100%)] hover:border-border-strong",
        quiet:
          "border-transparent bg-surface hover:border-border",
      },
      size: {
        md: "h-11",
        lg: "h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputShellVariants> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      leadingIcon,
      trailingIcon,
      variant,
      size,
      type = "text",
      ...props
    },
    ref
  ) => {
    const hasLeading = Boolean(leadingIcon);
    const hasTrailing = Boolean(trailingIcon);

    return (
      <div className={cn(inputShellVariants({ variant, size }))}>
        {hasLeading ? (
          <span
            className="pointer-events-none ml-3 flex items-center text-ink-subtle"
            aria-hidden
          >
            {leadingIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          type={type}
          className={cn(
            "h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle",
            hasLeading ? "pl-2.5" : "pl-4",
            hasTrailing ? "pr-2.5" : "pr-4",
            className
          )}
          {...props}
        />

        {hasTrailing ? (
          <span
            className="mr-3 flex items-center text-ink-subtle"
            aria-hidden
          >
            {trailingIcon}
          </span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export function SearchInput(props: Omit<InputProps, "variant" | "leadingIcon">) {
  return <Input variant="search" leadingIcon={<Search className="h-4 w-4" />} {...props} />;
}
