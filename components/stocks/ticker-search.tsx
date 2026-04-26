"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";

type SearchResult = {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
  currency: string;
  source: "finnhub" | "local";
};

type SearchResponse = {
  results: SearchResult[];
  providerStatus: "ok" | "fallback" | "error";
};

export function TickerSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [providerStatus, setProviderStatus] =
    useState<SearchResponse["providerStatus"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const normalizedQuery = query.trim().toUpperCase();
  const inputId = "ticker-search-input";

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/search/stocks?q=${encodeURIComponent(query.trim())}`,
          {
            signal: controller.signal,
          }
        );
        const json = (await response.json()) as SearchResponse;

        if (!response.ok) {
          throw new Error("Search failed.");
        }

        setResults(json.results ?? []);
        setProviderStatus(json.providerStatus ?? "fallback");
      } catch (error) {
        if (!controller.signal.aborted) {
          setResults([]);
          setProviderStatus("error");

          if (process.env.NODE_ENV === "development") {
            console.error("[ALQIS search] Client search failed", { error });
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, normalizedQuery ? 220 : 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, normalizedQuery]);

  const submitTarget = normalizedQuery ? results[0] : undefined;

  function navigateToTicker(symbol: string) {
    router.push(`/stocks/${symbol.trim().toUpperCase()}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitTarget) {
      navigateToTicker(submitTarget.ticker);
    }
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-secondary)_8%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-ai)_5%)_100%)] p-4 shadow-elevation-2 sm:rounded-[var(--radius-2xl)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Badge variant="ai" size="md" className="w-fit">
            <Search className="h-3.5 w-3.5" />
            Stock intelligence search
          </Badge>
          <div>
            <h2 className="font-serif text-[1.75rem] leading-tight tracking-tight text-ink sm:text-3xl">
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
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!submitTarget}
            className="w-full sm:w-auto"
          >
            Open
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p id="ticker-search-status" className="text-body-sm text-ink-subtle">
          {isLoading
            ? "Searching market symbols..."
            : normalizedQuery
              ? `${results.length} result${results.length === 1 ? "" : "s"}`
              : "Type a symbol or company name to search the ALQIS universe."}
          {submitTarget ? ` Press Enter to open ${submitTarget.ticker}.` : null}
        </p>
        {providerStatus === "fallback" ? (
          <p className="text-body-sm text-accent-ai">
            Showing curated ALQIS universe.
          </p>
        ) : providerStatus === "ok" && normalizedQuery ? (
          <p className="text-body-sm text-ink-subtle">
            Showing live search results.
          </p>
        ) : null}
      </form>

      <div className="mt-4 rounded-[var(--radius-xl)] border border-border/60 bg-surface/36 p-2">
        {isLoading ? (
          <div className="rounded-[var(--radius-lg)] border border-border/60 bg-surface-elevated/62 px-4 py-5">
            <p className="text-sm font-medium text-ink">Searching...</p>
            <p className="mt-1 text-body-sm text-ink-muted">
              Checking available market symbols.
            </p>
          </div>
        ) : results.length > 0 ? (
          <ul className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1 sm:max-h-[28rem]">
            {results.map((result) => (
              <li key={`${result.source}-${result.ticker}`}>
                <button
                  type="button"
                  onClick={() => navigateToTicker(result.ticker)}
                  className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-transparent px-3 py-3 text-left transition duration-[var(--duration-fast)] hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 text-base font-semibold text-ink" data-numeric>
                        {result.ticker}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-body-sm text-ink-muted">
                        {result.name}
                      </span>
                    </span>
                    <span className="mt-1 block text-body-sm text-ink-subtle">
                      {[result.exchange, result.type, result.currency]
                        .filter(Boolean)
                        .join(" / ")}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-border/60 bg-surface-elevated/62 px-4 py-5">
            <p className="text-sm font-medium text-ink">No matching ticker found.</p>
            <p className="mt-1 text-body-sm text-ink-muted">
              Try a symbol or company name from the curated ALQIS universe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
