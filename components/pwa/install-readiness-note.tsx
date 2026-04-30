import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InstallReadinessNoteProps = {
  className?: string;
};

export function InstallReadinessNote({ className }: InstallReadinessNoteProps) {
  return (
    <aside
      className={cn(
        "rounded-[var(--radius-lg)] border border-accent-ai/12 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-ai)_6%)] px-4 py-3 text-body-sm text-ink-muted",
        className
      )}
    >
      <Badge variant="ai" size="sm" className="normal-case tracking-normal">
        App shell ready
      </Badge>
      <p className="mt-2">
        ALQIS is prepared for installable web-app surfaces. Install prompts
        should remain user-initiated and non-intrusive.
      </p>
    </aside>
  );
}
