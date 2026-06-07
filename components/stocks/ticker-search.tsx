"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Search } from "lucide-react";
import { ExplainThis } from "@/components/education/explain-this";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { stockUniverse } from "@/lib/stocks/stock-universe";

type SearchResult = {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
  currency: string;
  source: "finnhub" | "local";
};

type SearchResponse = {
  results?: SearchResult[];
  providerStatus?: "ok" | "fallback" | "error";
  error?: string;
};

type RecentSearch = {
  ticker: string;
  name: string;
};

type DisplayItem = SearchResult & {
  section: "recent" | "popular" | "result";
};

const recentSearchesKey = "alqis_recent_searches";
const maxRecentSearches = 5;
const minQueryLength = 2;
const suggestedTickers = [
  "NVDA",
  "AAPL",
  "MSFT",
  "AMZN",
  "TSLA",
  "META",
  "GOOGL",
  "AMD",
  "JPM",
  "SPY",
] as const;

export function TickerSearch({
  compact = false,
  minimal = false,
  chrome = "card",
  placeholder = "Search ticker or company",
  showShortcut = false,
  enableShortcut = showShortcut,
  className = "",
}: {
  compact?: boolean;
  minimal?: boolean;
  chrome?: "card" | "nav";
  placeholder?: string;
  showShortcut?: boolean;
  enableShortcut?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [providerStatus, setProviderStatus] =
    useState<SearchResponse["providerStatus"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const normalizedQuery = query.trim().toUpperCase();
  const inputId = chrome === "nav" ? "ticker-search-nav-input" : "ticker-search-input";
  const isNavChrome = chrome === "nav";
  const popularResults = useMemo(
    () =>
      suggestedTickers
        .map((ticker) => stockUniverse.find((item) => item.ticker === ticker))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map((item): DisplayItem => ({
          ticker: item.ticker,
          name: item.companyName,
          exchange: item.exchange,
          type: item.type,
          currency: item.currency,
          source: "local",
          section: "popular",
        })),
    []
  );
  const recentResults = useMemo(
    () =>
      recentSearches.map((item): DisplayItem => {
        const universeItem = stockUniverse.find(
          (stock) => stock.ticker === item.ticker
        );

        return {
          ticker: item.ticker,
          name: item.name,
          exchange: universeItem?.exchange ?? "",
          type: universeItem?.type ?? "",
          currency: universeItem?.currency ?? "USD",
          source: "local",
          section: "recent",
        };
      }),
    [recentSearches]
  );
  const liveResults = useMemo(
    () =>
      results.map((result): DisplayItem => ({ ...result, section: "result" })),
    [results]
  );
  const displayItems = normalizedQuery
    ? liveResults
    : [...recentResults, ...popularResults];
  const submitTarget = normalizedQuery ? liveResults[highlightedIndex] ?? liveResults[0] : displayItems[highlightedIndex];
  const shouldShowDropdown =
    isFocused &&
    (isLoading ||
      Boolean(errorMessage) ||
      normalizedQuery.length < minQueryLength ||
      displayItems.length > 0);
  const hasLocalResults =
    normalizedQuery.length >= minQueryLength &&
    !isLoading &&
    !errorMessage &&
    (providerStatus === "fallback" || results.some((result) => result.source === "local"));

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    if (!enableShortcut) {
      return;
    }

    function handleShortcut(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  }, [enableShortcut]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, results.length, recentSearches.length]);

  useEffect(() => {
    if (normalizedQuery.length < minQueryLength) {
      setResults([]);
      setProviderStatus(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          `/api/search/stocks?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        const json = (await response.json().catch(() => null)) as SearchResponse | null;

        if (!response.ok) {
          if (response.status === 429) {
            setErrorMessage("Search is temporarily limited. Try again shortly.");
          } else {
            setErrorMessage("Search unavailable. Check your connection.");
          }
          setResults([]);
          setProviderStatus("error");
          return;
        }

        setResults(json?.results ?? []);
        setProviderStatus(json?.providerStatus ?? "fallback");
      } catch (error) {
        if (!controller.signal.aborted) {
          setResults([]);
          setProviderStatus("error");
          setErrorMessage("Search unavailable. Check your connection.");

          if (process.env.NODE_ENV === "development") {
            console.error("[ALQIS search] Client search failed", { error });
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, normalizedQuery]);

  function persistRecentSearch(result: Pick<SearchResult, "ticker" | "name">) {
    const nextRecent = [
      { ticker: result.ticker.toUpperCase(), name: result.name },
      ...recentSearches.filter((item) => item.ticker !== result.ticker.toUpperCase()),
    ].slice(0, maxRecentSearches);

    setRecentSearches(nextRecent);
    window.localStorage.setItem(recentSearchesKey, JSON.stringify(nextRecent));
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    window.localStorage.removeItem(recentSearchesKey);
  }

  function navigateToTicker(result: Pick<SearchResult, "ticker" | "name">) {
    const ticker = result.ticker.trim().toUpperCase();

    if (!ticker) {
      return;
    }

    persistRecentSearch({ ticker, name: result.name });
    setQuery("");
    setIsFocused(false);
    router.push(`/stocks/${ticker}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitTarget) {
      navigateToTicker(submitTarget);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsFocused(false);
      inputRef.current?.blur();
      return;
    }

    if (!displayItems.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % displayItems.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(
        (current) => (current - 1 + displayItems.length) % displayItems.length
      );
    } else if (event.key === "Enter" && submitTarget) {
      event.preventDefault();
      navigateToTicker(submitTarget);
    }
  }

  function handleBlur() {
    window.setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) {
        setIsFocused(false);
      }
    }, 120);
  }

  if (isNavChrome) {
    return (
      <div ref={rootRef} className={`relative min-w-0 ${className}`} onBlur={handleBlur}>
        <form
          onSubmit={handleSubmit}
          className="flex min-h-10 min-w-0 items-center gap-2 rounded-[0.85rem] border border-[rgba(86,126,176,0.22)] bg-[rgba(7,13,24,0.9)] px-3 text-sm text-[var(--ink-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus-within:border-[rgba(117,231,220,0.38)] focus-within:text-[#f4f8ff] hover:border-[rgba(117,231,220,0.38)] hover:text-[#f4f8ff]"
        >
          <Search className="h-4 w-4 shrink-0" />
          <input
            ref={inputRef}
            id={inputId}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            placeholder={placeholder}
            className="min-h-10 min-w-0 flex-1 bg-transparent text-sm text-[#f4f8ff] outline-none placeholder:text-[var(--ink-muted)]"
          />
          {showShortcut ? (
            <span className="ml-auto hidden shrink-0 rounded-md border border-[#25476f]/70 px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-[#5f7898] sm:inline">
              Ctrl K
            </span>
          ) : null}
        </form>
        <SearchDropdown
          open={shouldShowDropdown}
          compact
          query={normalizedQuery}
          isLoading={isLoading}
          errorMessage={errorMessage}
          results={displayItems}
          highlightedIndex={highlightedIndex}
          hasLocalResults={hasLocalResults}
          hasRecentSearches={recentSearches.length > 0 && !normalizedQuery}
          onClearRecent={clearRecentSearches}
          onSelect={navigateToTicker}
        />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      onBlur={handleBlur}
      className={`relative rounded-[1rem] border border-[rgba(86,126,176,0.24)] bg-[radial-gradient(circle_at_8%_0%,rgba(117,231,220,0.075),transparent_30%),linear-gradient(180deg,#102032_0%,#07111d_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_12px_30px_rgba(0,0,0,0.42)] ${
        compact ? "p-3" : "p-3 sm:p-4"
      } ${className}`}
    >
      <div className={minimal ? "mb-2 flex flex-wrap items-center justify-between gap-2" : compact ? "mb-2.5 flex flex-wrap items-start justify-between gap-3" : "mb-3 flex flex-wrap items-start justify-between gap-3"}>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="ai" size="sm" className="w-fit border-[rgba(117,231,220,0.28)] bg-[rgba(117,231,220,0.10)] text-[var(--accent)]">
              <Search className="h-3.5 w-3.5" />
              Stock intelligence search
            </Badge>
            <ExplainThis termId="stock-intelligence-search" compact />
          </div>
          {minimal ? null : (
            <div>
              <h2 className={compact ? "text-base font-semibold tracking-tight text-[#f2f7ff]" : "text-lg font-semibold tracking-tight text-[#f2f7ff] sm:text-xl"}>
                Start with a ticker.
              </h2>
              <p className={compact ? "mt-1 text-[0.78rem] leading-5 text-[var(--ink-muted)]" : "mt-1 text-body-sm text-[var(--ink-muted)]"}>
                Search a symbol or company to open the ALQIS explanation-led detail screen.
              </p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "space-y-2.5"}>
        <label htmlFor={inputId} className={minimal ? "sr-only" : "section-kicker block text-[#7891ad]"}>
          Search ticker or company
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="flex min-h-11 flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_82%,#1a2331_18%)_0%,color-mix(in_srgb,var(--surface)_94%,#0a1018_6%)_100%)] px-3 transition focus-within:border-accent focus-within:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-primary)_24%,transparent)]">
            <Search className="h-4 w-4 text-ink-subtle" />
            <input
              ref={inputRef}
              id={inputId}
              aria-describedby="ticker-search-status"
              autoComplete="off"
              placeholder={placeholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              className="h-full min-h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size={compact ? "md" : "lg"}
            disabled={!submitTarget}
            className="w-full sm:w-auto"
          >
            Open
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p id="ticker-search-status" className={minimal ? "text-[0.74rem] leading-5 text-[#7891ad]" : "text-body-sm text-[#7891ad]"}>
          {getStatusText({
            isLoading,
            query: normalizedQuery,
            resultCount: results.length,
            submitTarget,
          })}
        </p>
      </form>

      <SearchDropdown
        open={shouldShowDropdown}
        compact={compact}
        query={normalizedQuery}
        isLoading={isLoading}
        errorMessage={errorMessage}
        results={displayItems}
        highlightedIndex={highlightedIndex}
        hasLocalResults={hasLocalResults}
        hasRecentSearches={recentSearches.length > 0 && !normalizedQuery}
        onClearRecent={clearRecentSearches}
        onSelect={navigateToTicker}
      />
    </div>
  );
}

function SearchDropdown({
  open,
  compact,
  query,
  isLoading,
  errorMessage,
  results,
  highlightedIndex,
  hasLocalResults,
  hasRecentSearches,
  onClearRecent,
  onSelect,
}: {
  open: boolean;
  compact: boolean;
  query: string;
  isLoading: boolean;
  errorMessage: string | null;
  results: DisplayItem[];
  highlightedIndex: number;
  hasLocalResults: boolean;
  hasRecentSearches: boolean;
  onClearRecent: () => void;
  onSelect: (result: Pick<SearchResult, "ticker" | "name">) => void;
}) {
  if (!open) {
    return null;
  }

  const recentItems = results.filter((result) => result.section === "recent");
  const popularItems = results.filter((result) => result.section === "popular");
  const liveItems = results.filter((result) => result.section === "result");

  return (
    <div
      className={`absolute left-0 right-0 z-50 rounded-[0.9rem] border border-[rgba(86,126,176,0.22)] bg-[rgba(5,13,24,0.97)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_44px_rgba(0,0,0,0.46)] ${
        compact ? "mt-2" : "mt-3"
      }`}
    >
      {isLoading ? (
        <DropdownMessage title="Searching..." copy="Checking available market symbols." />
      ) : errorMessage ? (
        <DropdownMessage title={errorMessage} />
      ) : query.length === 1 ? (
        <DropdownMessage title="Keep typing..." copy="Enter at least 2 characters to search." />
      ) : query.length >= minQueryLength ? (
        liveItems.length ? (
          <>
            {hasLocalResults ? (
              <p className="px-2 pb-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#7891ad]">
                Results from local index
              </p>
            ) : null}
            <ResultList
              items={liveItems}
              highlightedIndex={highlightedIndex}
              offset={0}
              onSelect={onSelect}
            />
          </>
        ) : (
          <DropdownMessage title={`No results for ${query}`} />
        )
      ) : (
        <>
          {recentItems.length ? (
            <ResultSection
              label="Recent"
              actionLabel="Clear"
              onAction={onClearRecent}
              items={recentItems}
              highlightedIndex={highlightedIndex}
              offset={0}
              onSelect={onSelect}
              recent
            />
          ) : null}
          <ResultSection
            label="Popular"
            items={popularItems}
            highlightedIndex={highlightedIndex}
            offset={hasRecentSearches ? recentItems.length : 0}
            onSelect={onSelect}
          />
        </>
      )}
    </div>
  );
}

function ResultSection({
  label,
  actionLabel,
  onAction,
  items,
  highlightedIndex,
  offset,
  onSelect,
  recent = false,
}: {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
  items: DisplayItem[];
  highlightedIndex: number;
  offset: number;
  onSelect: (result: Pick<SearchResult, "ticker" | "name">) => void;
  recent?: boolean;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="not-first:mt-3">
      <div className="mb-1.5 flex items-center justify-between px-2">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#7891ad]">
          {label}
        </p>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="text-[0.72rem] font-semibold text-[#8ddcff] transition hover:text-[#eef6ff]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <ResultList
        items={items}
        highlightedIndex={highlightedIndex}
        offset={offset}
        onSelect={onSelect}
        recent={recent}
      />
    </div>
  );
}

function ResultList({
  items,
  highlightedIndex,
  offset,
  onSelect,
  recent = false,
}: {
  items: DisplayItem[];
  highlightedIndex: number;
  offset: number;
  onSelect: (result: Pick<SearchResult, "ticker" | "name">) => void;
  recent?: boolean;
}) {
  return (
    <ul className="scrollbar-dark grid max-h-[18rem] gap-1 overflow-y-auto pr-1">
      {items.map((result, index) => {
        const active = highlightedIndex === offset + index;

        return (
          <li key={`${result.section}-${result.ticker}`}>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(result)}
              className={
                active
                  ? "group flex min-h-12 w-full items-center justify-between gap-3 rounded-[0.75rem] border border-[#2d527f] bg-[#102033] px-3 py-2.5 text-left"
                  : "group flex min-h-12 w-full items-center justify-between gap-3 rounded-[0.75rem] border border-transparent px-3 py-2.5 text-left transition duration-[var(--duration-fast)] hover:border-[#2d527f] hover:bg-[#102033] focus-visible:outline-2 focus-visible:outline-accent"
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                {recent ? <Clock3 className="h-3.5 w-3.5 shrink-0 text-[#7891ad]" /> : null}
                <span className="shrink-0 text-sm font-black text-[#f2f7ff]" data-numeric>
                  {result.ticker}
                </span>
                <span className="min-w-0 truncate text-body-sm text-[#91a9c6]">
                  {result.name}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#7891ad] transition group-hover:translate-x-0.5 group-hover:text-[#7bbcff]" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function DropdownMessage({ title, copy }: { title: string; copy?: string }) {
  return (
    <div className="rounded-[0.8rem] border border-[#213d63]/72 bg-[#0d1b2e] px-4 py-4">
      <p className="text-sm font-medium text-[#f2f7ff]">{title}</p>
      {copy ? <p className="mt-1 text-body-sm text-[#91a9c6]">{copy}</p> : null}
    </div>
  );
}

function readRecentSearches(): RecentSearch[] {
  try {
    const raw = window.localStorage.getItem(recentSearchesKey);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is RecentSearch =>
          item &&
          typeof item === "object" &&
          typeof item.ticker === "string" &&
          typeof item.name === "string"
      )
      .map((item) => ({
        ticker: item.ticker.trim().toUpperCase(),
        name: item.name.trim(),
      }))
      .filter((item) => item.ticker && item.name)
      .slice(0, maxRecentSearches);
  } catch {
    return [];
  }
}

function getStatusText({
  isLoading,
  query,
  resultCount,
  submitTarget,
}: {
  isLoading: boolean;
  query: string;
  resultCount: number;
  submitTarget?: SearchResult;
}) {
  if (isLoading) {
    return "Searching market symbols...";
  }

  if (query.length === 1) {
    return "Keep typing to search the ALQIS universe.";
  }

  if (query.length >= minQueryLength) {
    return `${resultCount} result${resultCount === 1 ? "" : "s"}${
      submitTarget ? ` Press Enter to open ${submitTarget.ticker}.` : ""
    }`;
  }

  return "Focus the field for recent searches and popular tickers.";
}
