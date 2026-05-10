"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { ExplainThis } from "@/components/education/explain-this";
import type { CacheStatus } from "@/lib/cache";
import type { DailyMarketBrief } from "@/lib/market/brief";
import type { BriefFocus } from "@/lib/preferences/types";
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

type DailyBriefResponse = DailyMarketBrief & {
  cacheStatus?: CacheStatus;
  cachedAt?: string;
  expiresAt?: string;
  error?: string;
};

export function DailyBriefCard({ briefFocus = "balanced" }: { briefFocus?: BriefFocus }) {
  const [brief, setBrief] = useState<DailyBriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBrief = useCallback(async (forceRefresh: boolean) => {
    setError(null);
    setIsLoading(!forceRefresh);
    setIsRefreshing(forceRefresh);

    try {
      const response = await fetch(
        `/api/market/brief${forceRefresh ? "?refresh=true" : ""}`,
        {
          cache: "no-store",
        }
      );
      const json = (await response.json()) as DailyBriefResponse;

      if (!response.ok) {
        throw new Error(json.error ?? "Daily brief unavailable.");
      }

      setBrief(json);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Daily brief unavailable."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadBrief(false);
  }, [loadBrief]);

  return (
    <Card
      variant="subtle"
      radius="xl"
      className="border-accent-ai/14 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_84%,var(--accent-ai)_10%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_4%)_100%)] shadow-[0_24px_60px_rgba(2,6,10,0.2)]"
    >
      <CardHeader className="mb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <CardEyebrow>
              <CalendarDays className="h-3.5 w-3.5" />
              Daily Market Brief
              <ExplainThis termId="daily-market-brief" compact />
            </CardEyebrow>
            <CardTitle className="text-[1.35rem] sm:text-[1.65rem]">
              {brief ? getBriefDisplayHeadline(brief) : "Preparing market context"}
            </CardTitle>
            <CardDescription className="text-body-sm leading-6">
              {brief
                ? `${getBriefSupportCopy(brief)} Focus: ${formatFocusLabel(briefFocus)}.`
                : "ALQIS is checking your saved names and available market data."}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Badge variant={getStatusVariant(brief?.status)} size="sm" className="normal-case tracking-normal">
              {brief?.status ? formatStatus(brief.status) : "Loading"}
            </Badge>
            {brief ? (
              <Badge variant="outline" size="sm" className="normal-case tracking-normal">
                Generated {formatBriefTime(brief.generatedAt)}
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isRefreshing}
              onClick={() => void loadBrief(true)}
              className="min-h-10"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <BriefSkeleton />
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-warn/20 bg-warn-bg/28 px-4 py-3 text-body-sm text-warn">
            {error}
          </div>
        ) : brief ? (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-accent-ai/12 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-ai)_6%)] px-4 py-3.5 lg:px-5">
              <p className="max-w-5xl text-body leading-7 text-ink-muted">
                {shortenSummary(brief.summary)}
              </p>
            </div>

            {brief.dataNotes.length ? (
              <div className="flex flex-wrap gap-2">
                {brief.dataNotes.map((note) => (
                  <Badge key={note} variant="outline" size="sm" className="normal-case tracking-normal">
                    {note}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)_minmax(0,0.95fr)]">
              <CompactSection title="Watchlist movers">
                {brief.watchlistMovers.length ? (
                  <div className="flex flex-wrap gap-2">
                    {brief.watchlistMovers.slice(0, 3).map((mover) => (
                      <span
                        key={mover.ticker}
                        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border/60 bg-surface/45 px-3 text-sm font-medium text-ink"
                      >
                        <span>{mover.ticker}</span>
                        <span
                          className={
                            mover.direction === "up"
                              ? "text-gain"
                              : mover.direction === "down"
                                ? "text-loss"
                                : "text-ink-subtle"
                          }
                          data-numeric
                        >
                          {formatPercent(mover.changePercent)}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm leading-6 text-ink-muted">
                    No usable mover data yet. Save tickers or refresh when provider data is available.
                  </p>
                )}
              </CompactSection>

              <CompactSection title="Market theme">
                <CompactList items={brief.marketThemes} />
              </CompactSection>

              <CompactSection title="What to watch">
                <CompactList items={brief.whatToWatch} compact />
              </CompactSection>
            </div>

            <p className="border-t border-border/60 pt-3 text-body-sm leading-6 text-ink-subtle">
              ALQIS explanations are informational only and do not constitute investment advice.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CompactSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border/64 bg-[color-mix(in_srgb,var(--surface-elevated)_78%,var(--surface)_22%)] px-4 py-3">
      <div className="flex flex-col gap-2">
        <p className="section-kicker shrink-0 text-ink-subtle">{title}</p>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function CompactList({
  items,
  compact = false,
}: {
  items: DailyMarketBrief["marketThemes"];
  compact?: boolean;
}) {
  if (!items.length) {
    return (
      <p className="text-body-sm leading-6 text-ink-muted">
        Brief limited while market data is partially available.
      </p>
    );
  }

  return (
    <ul className={compact ? "flex flex-wrap gap-2" : "space-y-2"}>
      {items.slice(0, 3).map((item) => (
        <li
          key={item.label}
          className={
            compact
              ? "inline-flex min-h-9 items-center rounded-full border border-border/60 bg-surface/45 px-3 text-body-sm font-medium text-ink"
              : "text-body-sm leading-6"
          }
        >
          <span className="font-medium text-ink">{item.label}</span>
          {compact ? null : (
            <span className="text-ink-muted"> - {shortenDetail(item.detail)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function BriefSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-2/3 rounded-full bg-surface-elevated" />
      <div className="h-[4.5rem] rounded-[var(--radius-lg)] bg-surface/55" />
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-16 rounded-[var(--radius-lg)] bg-surface/55" />
        <div className="h-16 rounded-[var(--radius-lg)] bg-surface/55" />
        <div className="h-16 rounded-[var(--radius-lg)] bg-surface/55" />
      </div>
    </div>
  );
}

function getStatusVariant(status?: DailyMarketBrief["status"]) {
  if (status === "ok") return "ai";
  if (status === "limited") return "warn";
  if (status === "unavailable") return "loss";
  return "outline";
}

function formatStatus(status: DailyMarketBrief["status"]) {
  if (status === "ok") return "Live brief";
  if (status === "limited") return "Limited brief";
  return "Brief unavailable";
}

function formatBriefTime(value: string) {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return "just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatFocusLabel(value: BriefFocus) {
  if (value === "market_context") return "Market context";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getBriefDisplayHeadline(brief: DailyMarketBrief) {
  if (brief.status === "unavailable") {
    return "Market brief unavailable";
  }

  if (brief.headline.toLowerCase().includes("curated")) {
    return "Curated market brief active";
  }

  if (brief.status === "limited") {
    return "Limited market brief active";
  }

  return "Daily market brief active";
}

function getBriefSupportCopy(brief: DailyMarketBrief) {
  if (brief.status === "unavailable") {
    return "Provider data is limited right now.";
  }

  if (brief.headline.toLowerCase().includes("curated")) {
    return "ALQIS is using curated market reads until your watchlist grows.";
  }

  if (brief.status === "limited") {
    return "ALQIS has partial market context for this brief.";
  }

  return brief.headline;
}

function shortenSummary(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= 190) {
    return normalized;
  }

  return `${normalized.slice(0, 187).trim()}...`;
}

function shortenDetail(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= 86) {
    return normalized;
  }

  return `${normalized.slice(0, 83).trim()}...`;
}
