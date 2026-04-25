"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center gap-1 overflow-x-auto rounded-[var(--radius-md)] border border-border/80 bg-surface-alt/65 p-1 scrollbar-hide",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex h-full min-w-[4.5rem] items-center justify-center rounded-[0.95rem] px-3 text-sm font-medium text-ink-subtle transition-[background-color,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]",
      "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
      "data-[state=active]:border data-[state=active]:border-border-strong/70 data-[state=active]:bg-surface-elevated data-[state=active]:text-ink data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_8px_22px_rgba(2,6,12,0.14)]",
      "hover:text-ink",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-4 outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
