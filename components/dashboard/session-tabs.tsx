const sessions = [
  "Pre-market",
  "Market Open",
  "Midday",
  "Power Hour",
  "After Close",
  "Weekend",
  "Earnings",
];

export function SessionTabs() {
  return (
    <nav
      aria-label="Market session"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div className="flex min-w-max gap-2 rounded-[var(--radius-xl)] border border-border/60 bg-surface/34 p-1.5">
        {sessions.map((session, index) => (
          <button
            key={session}
            type="button"
            className={
              index === 0
                ? "min-h-10 rounded-[var(--radius-lg)] border border-accent-ai/16 bg-[color-mix(in_srgb,var(--accent-ai)_14%,var(--surface-elevated)_86%)] px-4 text-sm font-medium text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                : "min-h-10 rounded-[var(--radius-lg)] border border-transparent px-4 text-sm font-medium text-ink-muted transition hover:border-border/70 hover:bg-surface/50 hover:text-ink"
            }
            aria-current={index === 0 ? "page" : undefined}
          >
            {session}
          </button>
        ))}
      </div>
    </nav>
  );
}
