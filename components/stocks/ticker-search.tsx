"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import { demoStocks } from "@/lib/stocks/demo-stocks";

function getTickerSearchScore(stock: (typeof demoStocks)[number], query: string) {
  if (!query) {
    return 1;
  }

  const symbol = stock.symbol.toUpperCase();
  const companyName = stock.companyName.toUpperCase();

  if (symbol === query) return 100;
  if (symbol.startsWith(query)) return 90;
  if (companyName.startsWith(query)) return 80;
  if (symbol.includes(query)) return 70;
  if (companyName.includes(query)) return 60;

  return 0;
}

export function TickerSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toUpperCase();
  const inputId = "ticker-search-input";

  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return demoStocks;
    }

    return demoStocks
      .map((stock) => ({
        stock,
        score: getTickerSearchScore(stock, normalizedQuery),
      }))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score || a.stock.symbol.localeCompare(b.stock.symbol))
      .map((match) => match.stock);
  }, [normalizedQuery]);

  const submitTarget = normalizedQuery ? matches[0] : undefined;

  function navigateToTicker(symbol: string) {
    router.push(`/stocks/${symbol.trim().toUpperCase()}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitTarget) {
      navigateToTicker(submitTarget.symbol);
    }
  }

  return (
    <div className="rounded-[var(--radius-2xl)] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-secondary)_8%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-ai)_5%)_100%)] p-4 shadow-elevation-2 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Badge variant="ai" size="md" className="w-fit">
            <Search className="h-3.5 w-3.5" />
            Stock intelligence search
          </Badge>
          <div>
            <h2 className="font-serif text-3xl tracking-tight text-ink">
              Start with a ticker.
            </h2>
            <p className="mt-1 text-body text-ink-muted">
              Search a symbol or company to open the ALQIS explanation-led detail screen.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <label htmlFor={inputId} className="section-kicker block text-ink-muted">
          Search ticker or company
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            id={inputId}
            aria-describedby="ticker-search-status"
            autoComplete="off"
            placeholder="Search ticker or company"
            size="lg"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" variant="primary" size="lg" disabled={!submitTarget}>
            Open
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p id="ticker-search-status" className="text-body-sm text-ink-subtle">
          {normalizedQuery
            ? `${matches.length} tracked result${matches.length === 1 ? "" : "s"}`
            : "Type a symbol or company name to filter the tracked universe."}
          {submitTarget ? ` Press Enter to open ${submitTarget.symbol}.` : null}
        </p>
      </form>

      <div className="mt-4 rounded-[var(--radius-xl)] border border-border/60 bg-surface/36 p-2">
        {matches.length > 0 ? (
          <ul className="grid gap-2">
            {matches.map((stock) => (
              <li key={stock.symbol}>
                <button
                  type="button"
                  onClick={() => navigateToTicker(stock.symbol)}
                  className="group flex w-full items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-transparent px-3 py-3 text-left transition duration-[var(--duration-fast)] hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-base font-semibold text-ink" data-numeric>
                        {stock.symbol}
                      </span>
                      <span className="truncate text-body-sm text-ink-muted">
                        {stock.companyName}
                      </span>
                    </span>
                    <span className="mt-1 block text-body-sm text-ink-subtle">
                      {stock.sector}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-border/60 bg-surface-elevated/62 px-4 py-5">
            <p className="text-sm font-medium text-ink">No tracked ticker found.</p>
            <p className="mt-1 text-body-sm text-ink-muted">
              Try NVDA, AAPL, MSFT, AMD, or TSLA while the tracked universe expands.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
