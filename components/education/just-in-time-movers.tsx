"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";

export type JustInTimeMover = {
  ticker: string;
  changePercent: number;
  reason: string;
  concept: {
    id: string;
    term: string;
    tagLabel: string;
  };
};

export function JustInTimeMovers({ movers }: { movers: JustInTimeMover[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleMovers = expanded ? movers : movers.slice(0, 2);
  const hasHiddenMovers = movers.length > 2;

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {visibleMovers.map((mover) => (
          <article
            key={mover.ticker}
            className="rounded-xl border border-accent/14 bg-[radial-gradient(ellipse_at_18%_0%,color-mix(in_srgb,var(--accent)_5%,transparent),transparent_44%),color-mix(in_srgb,var(--surface-elevated)_78%,transparent)] p-4 shadow-[var(--highlight-top),0_14px_38px_rgba(2,6,12,0.42)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-ink">{mover.ticker}</span>
                <DeltaChip value={mover.changePercent} />
              </div>
              <span className="rounded-full border border-accent/35 px-2 py-1 text-[0.58rem] font-black uppercase tracking-[0.14em] text-accent">
                {mover.concept.tagLabel}
              </span>
            </div>
            <h3 className="mt-6 text-base font-black text-ink">
              {mover.ticker} moved {formatPercent(mover.changePercent)}
            </h3>
            <p className="mt-4 border-l-2 border-accent pl-2 text-[0.65rem] font-black uppercase tracking-[0.18em] text-accent">
              Learn this because
            </p>
            <p className="mt-2 min-h-20 text-sm leading-6 text-ink-muted">
              {mover.reason}
            </p>
            <Link
              href={`#${mover.concept.id}`}
              className="mt-4 inline-flex items-center gap-1 text-xs font-black text-accent"
            >
              Open the explainer <ChevronRight className="h-3 w-3" />
            </Link>
          </article>
        ))}
      </div>
      {hasHiddenMovers ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-4 rounded-md border border-[rgba(244,238,226,0.2)] bg-transparent px-4 py-1.5 text-xs font-black text-ink-muted transition hover:border-[rgba(244,238,226,0.4)] hover:text-ink"
        >
          {expanded ? "Show less" : "Show all movers"}
        </button>
      ) : null}
      <p className="mt-4 rounded-xl border border-border bg-surface/70 px-3 py-2 text-xs font-semibold text-ink-subtle">
        Sample data - illustrative, not live.
      </p>
    </>
  );
}

function DeltaChip({ value }: { value: number }) {
  const isUp = value >= 0;

  return (
    <span
      className={
        isUp
          ? "inline-flex items-center gap-1 rounded-full border border-gain/45 bg-gain/15 px-2 py-1 text-[0.65rem] font-black text-gain"
          : "inline-flex items-center gap-1 rounded-full border border-loss/45 bg-loss/15 px-2 py-1 text-[0.65rem] font-black text-loss"
      }
      data-numeric
    >
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {formatPercent(value)}
    </span>
  );
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
