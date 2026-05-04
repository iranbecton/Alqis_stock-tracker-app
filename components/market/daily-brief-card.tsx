"use client";

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
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardEyebrow>
              <CalendarDays className="h-3.5 w-3.5" />
              Daily Market Brief
              <ExplainThis termId="daily-market-brief" compact />
            </CardEyebrow>
            <CardTitle>{brief?.headline ?? "Preparing today's market context."}</CardTitle>
            <CardDescription>
              {brief
                ? `Generated ${formatBriefTime(brief.generatedAt)}. Focus: ${formatFocusLabel(briefFocus)}.`
                : "ALQIS is checking your saved names and available market data."}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getStatusVariant(brief?.status)} size="sm" className="normal-case tracking-normal">
              {brief?.status ? formatStatus(brief.status) : "Loading"}
            </Badge>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isRefreshing}
              onClick={() => void loadBrief(true)}
              className="min-h-11"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh brief"}
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
          <div className="space-y-5">
            <p className="max-w-4xl text-body text-ink-muted">{brief.summary}</p>

            {brief.dataNotes.length ? (
              <div className="flex flex-wrap gap-2">
                {brief.dataNotes.map((note) => (
                  <Badge key={note} variant="outline" size="sm" className="normal-case tracking-normal">
                    {note}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
              <BriefPanel title="Watchlist movers">
                {brief.watchlistMovers.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {brief.watchlistMovers.map((mover) => (
                      <div
                        key={mover.ticker}
                        className="rounded-[var(--radius-md)] border border-border/60 bg-surface/42 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">{mover.ticker}</p>
                            <p className="mt-1 text-[0.78rem] leading-5 text-ink-subtle">
                              {mover.companyName}
                            </p>
                          </div>
                          <span
                            className={
                              mover.direction === "up"
                                ? "text-sm font-medium text-gain"
                                : mover.direction === "down"
                                  ? "text-sm font-medium text-loss"
                                  : "text-sm font-medium text-ink-subtle"
                            }
                            data-numeric
                          >
                            {formatPercent(mover.changePercent)}
                          </span>
                        </div>
                        <p className="mt-2 text-body-sm text-ink-muted">{mover.note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-ink-muted">
                    No usable mover data yet. Save tickers or refresh when provider data is available.
                  </p>
                )}
              </BriefPanel>

              <div className="grid gap-3">
                <BriefPanel title="Market themes">
                  <BriefList items={brief.marketThemes} />
                </BriefPanel>
                <BriefPanel title="What to watch">
                  <BriefList items={brief.whatToWatch} />
                </BriefPanel>
              </div>
            </div>

            <p className="border-t border-border/60 pt-3 text-[0.78rem] leading-5 text-ink-subtle">
              ALQIS explanations are informational only and do not constitute investment advice.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BriefPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_80%,var(--surface)_20%)] p-4">
      <p className="section-kicker">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BriefList({ items }: { items: DailyMarketBrief["marketThemes"] }) {
  if (!items.length) {
    return (
      <p className="text-body-sm text-ink-muted">
        Brief limited while market data is partially available.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="space-y-1">
          <p className="text-sm font-medium text-ink">{item.label}</p>
          <p className="text-body-sm text-ink-muted">{item.detail}</p>
        </li>
      ))}
    </ul>
  );
}

function BriefSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-2/3 rounded-full bg-surface-elevated" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="h-32 rounded-[var(--radius-lg)] bg-surface/55" />
        <div className="h-32 rounded-[var(--radius-lg)] bg-surface/55" />
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
