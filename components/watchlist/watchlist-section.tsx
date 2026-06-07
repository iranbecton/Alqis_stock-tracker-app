"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, ExternalLink, RefreshCw } from "lucide-react";
import { ExplainThis } from "@/components/education/explain-this";
import { AlertEntryButton } from "@/components/alerts/alert-entry-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WatchlistRemoveButton } from "@/components/watchlist/watchlist-remove-button";
import type { WatchlistIntelligenceItem } from "@/lib/watchlist/types";

type WatchlistSectionProps = {
  initialItems: WatchlistIntelligenceItem[];
  initialError?: string;
  compact?: boolean;
  maxItems?: number;
};

type WatchlistIntelligenceResponse = {
  items: WatchlistIntelligenceItem[];
  error?: string;
};

export function WatchlistSection({
  initialItems,
  initialError,
  compact = false,
  maxItems,
}: WatchlistSectionProps) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState(initialError);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const allDataUnavailable =
    items.length > 0 && items.every((item) => item.dataState === "Data unavailable");
  const visibleItems =
    compact && maxItems ? items.slice(0, maxItems) : items;

  useEffect(() => {
    function handleRemoved(event: Event) {
      const detail = (event as CustomEvent<{ ticker?: string }>).detail;
      const ticker = detail?.ticker;

      if (!ticker) {
        return;
      }

      setItems((currentItems) =>
        currentItems.filter((item) => item.ticker !== ticker)
      );
    }

    window.addEventListener("alqis:watchlist-removed", handleRemoved);
    return () =>
      window.removeEventListener("alqis:watchlist-removed", handleRemoved);
  }, []);

  async function refreshWatchlist() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    setError(undefined);

    try {
      const response = await fetch("/api/watchlist/intelligence?refresh=1", {
        cache: "no-store",
      });
      const json = (await response.json()) as WatchlistIntelligenceResponse;

      if (!response.ok) {
        throw new Error(
          json.error ??
            "Watchlist data unavailable. Your saved tickers are still preserved."
        );
      }

      setItems(json.items ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Watchlist data unavailable. Your saved tickers are still preserved."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  if (!items.length) {
    return null;
  }

  return (
    <Card
      variant="subtle"
      radius="xl"
      className="border-[rgba(108,155,205,0.30)] bg-[radial-gradient(ellipse_at_12%_0%,rgba(117,231,220,0.12),transparent_38%),radial-gradient(ellipse_at_92%_16%,rgba(86,126,176,0.14),transparent_42%),linear-gradient(180deg,#1d2d3c_0%,#132230_55%,#0d1825_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.13),inset_0_0_0_1px_rgba(255,255,255,0.05),0_28px_64px_rgba(2,6,12,0.62),0_0_42px_rgba(117,231,220,0.07)]"
    >
      <CardHeader className={compact ? "mb-3" : undefined}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardEyebrow className="text-[var(--accent)]">
              <Bookmark className="h-3.5 w-3.5" />
              Watchlist Intelligence
              <ExplainThis termId="watchlist" compact />
            </CardEyebrow>
            <CardTitle className={compact ? "text-[1.15rem]" : "text-[1.35rem]"}>Saved names, translated into reads.</CardTitle>
            <CardDescription className={compact ? "mt-1 text-body-sm leading-5 text-[var(--ink-muted)]" : "text-[var(--ink-muted)]"}>
              Ticker cards combine price movement, data state, confidence, and
              a one-line ALQIS read.
            </CardDescription>
            {compact && items.length > visibleItems.length ? (
              <p className="mt-2 text-body-sm text-[#7891ad]">
                Showing {visibleItems.length} of {items.length} saved names.
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isRefreshing}
            onClick={() => void refreshWatchlist()}
            className={compact ? "min-h-9 w-full sm:w-fit" : "min-h-11 w-full sm:w-fit"}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Updating reads..." : "Refresh reads"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="mb-3 rounded-[var(--radius-lg)] border border-warn/20 bg-warn-bg/28 px-4 py-3 text-body-sm text-warn">
            {error}
          </div>
        ) : null}

        {!error && allDataUnavailable ? (
          <div className="mb-3 rounded-[var(--radius-lg)] border border-warn/20 bg-warn-bg/28 px-4 py-3 text-body-sm text-warn">
            Watchlist data unavailable. Your saved tickers are still preserved.
          </div>
        ) : null}

        {isRefreshing && items.length === 0 ? (
          <WatchlistSkeleton />
        ) : (
          <div className={compact ? "grid grid-cols-1 gap-2.5" : "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"}>
            {visibleItems.map((item) => (
              <WatchlistIntelligenceCard
                key={item.id}
                item={item}
                compact={compact}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WatchlistIntelligenceCard({
  item,
  compact = false,
}: {
  item: WatchlistIntelligenceItem;
  compact?: boolean;
}) {
  return (
    <article className={`group min-w-0 rounded-[0.9rem] border border-[rgba(86,126,176,0.22)] bg-[rgba(7,17,30,0.72)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-[var(--duration-fast)] hover:border-[rgba(117,231,220,0.38)] hover:bg-[#102033] ${compact ? "p-3" : "p-4"}`}>
      <div className={`flex h-full min-w-0 flex-col ${compact ? "gap-2.5" : "gap-4"}`}>
        <div className="grid min-w-0 gap-3 min-[430px]:grid-cols-[minmax(0,1fr)_auto] min-[430px]:items-start">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className={compact ? "min-w-0 truncate text-base font-semibold tracking-tight text-[#f2f7ff]" : "min-w-0 truncate text-lg font-semibold tracking-tight text-[#f2f7ff]"}>
                {item.ticker}
              </p>
              <Badge variant={getDirectionBadgeVariant(item.direction)} size="sm">
                {formatDirection(item.direction)}
              </Badge>
            </div>
            <p className="mt-1 truncate text-body-sm font-medium text-[#91a9c6]">
              {item.companyName ?? "Saved ticker"}
            </p>
            <p className={compact ? "mt-1 text-[0.72rem] leading-4 text-[#7891ad]" : "mt-1 text-[0.78rem] leading-5 text-[#7891ad]"}>
              {formatRefreshedAt(item.refreshedAt)}
            </p>
          </div>
          <div className="min-w-0 text-left min-[430px]:min-w-[7.25rem] min-[430px]:shrink-0 min-[430px]:text-right">
            <p className={compact ? "text-base font-semibold tracking-tight text-[#f2f7ff]" : "text-lg font-semibold tracking-tight text-[#f2f7ff]"} data-numeric>
              {formatCurrencyOrDash(item.currentPrice)}
            </p>
            <p className={getMoveClassName(item.direction)} data-numeric>
              {formatMove(item.change, item.changePercent)}
            </p>
          </div>
        </div>

        <Link
          href={`/stocks/${item.ticker}`}
          className="min-w-0 flex-1 rounded-[var(--radius-md)] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4"
        >
          <div className="flex min-w-0 flex-wrap gap-2">
            {item.sector ? (
              <Badge variant="outline" size="sm" className="max-w-full normal-case tracking-normal">
                {item.sector}
              </Badge>
            ) : null}
            <Badge variant={getDataStateVariant(item.dataState)} size="sm" className="max-w-full normal-case tracking-normal">
              {item.dataState}
            </Badge>
            <Badge variant="ai" size="sm" className="max-w-full normal-case tracking-normal">
              {item.confidence ?? item.readStatus}
            </Badge>
          </div>
          <p className={`${compact ? "mt-2 leading-5 [-webkit-line-clamp:1]" : "mt-4 leading-6 [-webkit-line-clamp:2]"} overflow-hidden break-words text-body-sm text-[#d9e9ff] [display:-webkit-box] [-webkit-box-orient:vertical]`}>
            {item.providerStatus === "unavailable" ||
            item.dataState === "Data unavailable"
              ? "ALQIS could not verify a clear move yet."
              : shortenQuickRead(item.quickRead)}
          </p>
        </Link>

        <div className={compact ? "mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-2" : "mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3"}>
          <Button asChild variant="quiet" size="sm" className={compact ? "min-h-8 min-w-0" : "min-h-10 min-w-0"}>
            <Link href={`/stocks/${item.ticker}`}>
              <span className="truncate">Open read</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <AlertEntryButton
            initialTicker={item.ticker}
            initialCompanyName={item.companyName}
            className={compact ? "min-h-8 min-w-0 px-3 text-sm" : "min-h-10 min-w-0 px-3 text-sm"}
          >
            Alert
          </AlertEntryButton>
          <WatchlistRemoveButton ticker={item.ticker} />
        </div>
      </div>
    </article>
  );
}

function WatchlistSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="min-h-48 rounded-[var(--radius-lg)] border border-border/60 bg-surface/40 p-4"
        >
          <div className="h-4 w-20 rounded-full bg-surface-elevated" />
          <div className="mt-4 h-7 w-32 rounded-full bg-surface-elevated" />
          <div className="mt-5 h-4 w-full rounded-full bg-surface-elevated" />
          <div className="mt-2 h-4 w-3/4 rounded-full bg-surface-elevated" />
        </div>
      ))}
    </div>
  );
}

function getDirectionBadgeVariant(direction: WatchlistIntelligenceItem["direction"]) {
  if (direction === "up") return "gain";
  if (direction === "down") return "loss";
  return "outline";
}

function getDataStateVariant(dataState: WatchlistIntelligenceItem["dataState"]) {
  if (dataState === "Live data") return "outline";
  if (dataState === "Data unavailable") return "loss";
  return "ai";
}

function formatDirection(direction: WatchlistIntelligenceItem["direction"]) {
  if (direction === "up") return "Up";
  if (direction === "down") return "Down";
  return "Flat";
}

function getMoveClassName(direction: WatchlistIntelligenceItem["direction"]) {
  const base = "mt-1 whitespace-nowrap text-[0.82rem] font-medium leading-5";

  if (direction === "up") {
    return `${base} text-gain`;
  }

  if (direction === "down") {
    return `${base} text-loss`;
  }

  return `${base} text-ink-subtle`;
}

function formatRefreshedAt(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Updated just now";
  }

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Updated just now";
  }

  if (diffMinutes < 60) {
    return `Updated ${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Updated ${diffHours} hr ago`;
  }

  return `Updated ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))}`;
}

function formatCurrencyOrDash(value: number | null) {
  if (typeof value !== "number") {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 2 : 2,
  }).format(value);
}

function formatMove(change: number | null, changePercent: number | null) {
  if (typeof change !== "number" || typeof changePercent !== "number") {
    return "Data unavailable";
  }

  const changePrefix = change >= 0 ? "+" : "";
  const pctPrefix = changePercent >= 0 ? "+" : "";

  return `${changePrefix}${formatCompactNumber(change)} / ${pctPrefix}${changePercent.toFixed(2)}%`;
}

function shortenQuickRead(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= 132) {
    return normalized;
  }

  return `${normalized.slice(0, 129).trim()}...`;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
