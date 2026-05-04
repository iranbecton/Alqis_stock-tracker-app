"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { getGlossaryEntry } from "@/lib/education/glossary";
import { cn } from "@/lib/utils";

type ExplainThisProps = {
  termId: string;
  label?: string;
  compact?: boolean;
  className?: string;
};

export function ExplainThis({
  termId,
  label = "Explain this",
  compact = false,
  className,
}: ExplainThisProps) {
  const entry = getGlossaryEntry(termId);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!entry) {
    return null;
  }

  return (
    <span
      ref={rootRef}
      onMouseLeave={() => setIsOpen(false)}
      className={cn("relative inline-flex align-middle", className)}
    >
      <button
        type="button"
        aria-label={`Explain ${entry.term}`}
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setIsOpen(true)}
        className={cn(
          "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border border-accent-ai/14 bg-[color-mix(in_srgb,var(--accent-ai)_9%,transparent)] px-2.5 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-accent-ai transition duration-[var(--duration-fast)] hover:border-accent-ai/28 hover:bg-[color-mix(in_srgb,var(--accent-ai)_15%,transparent)] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          compact && "min-h-6 px-1.5 text-[0.68rem]"
        )}
      >
        <HelpCircle className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
      </button>

      {isOpen ? (
        <span
          id={popoverId}
          role="dialog"
          aria-label={`${entry.term} explanation`}
          className="fixed inset-x-4 bottom-4 z-50 max-h-[72vh] overflow-y-auto rounded-[var(--radius-xl)] border border-accent-ai/18 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_92%,var(--accent-ai)_8%)_0%,color-mix(in_srgb,var(--surface)_96%,var(--accent-secondary)_4%)_100%)] p-4 text-left normal-case tracking-normal text-ink shadow-[0_28px_80px_rgba(2,6,12,0.52)] sm:absolute sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-[calc(100%+0.55rem)] sm:w-80 sm:-translate-x-1/2"
        >
          <span className="flex items-start justify-between gap-3">
            <span>
              <span className="section-kicker block text-accent-ai">Explain this</span>
              <span className="mt-1 block text-base font-semibold text-ink">{entry.term}</span>
            </span>
            <button
              type="button"
              aria-label="Close explanation"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface/50 text-ink-subtle transition hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </span>

          <span className="mt-3 block space-y-3 text-body-sm leading-6 text-ink-muted">
            <span className="block font-medium text-ink">{entry.shortDefinition}</span>
            <span className="block">{entry.plainEnglish}</span>
            <span className="block rounded-[var(--radius-md)] border border-border/60 bg-surface/44 px-3 py-2">
              <span className="section-kicker mb-1 block text-ink-subtle">Why it matters</span>
              {entry.whyItMatters}
            </span>
            {entry.caution ? (
              <span className="block rounded-[var(--radius-md)] border border-warn/18 bg-warn-bg/20 px-3 py-2 text-warn">
                <span className="section-kicker mb-1 block text-warn">Caution</span>
                {entry.caution}
              </span>
            ) : null}
          </span>
        </span>
      ) : null}
    </span>
  );
}
