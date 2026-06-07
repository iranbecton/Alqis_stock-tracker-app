"use client";

import { useEffect, useMemo, useState } from "react";
import { Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NewsClassification, ScoredNewsItem } from "@/lib/news/classify";

type NewsResponse = {
  items?: ScoredNewsItem[];
};

type DashboardNewsItem = ScoredNewsItem & {
  ticker: string;
};

const fallbackTickers = ["NVDA", "AAPL", "MSFT", "AMZN"] as const;

export function MarketNewsFeed({ tickers }: { tickers: string[] }) {
  const [items, setItems] = useState<DashboardNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const feedTickers = useMemo(() => normalizeTickers(tickers), [tickers]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setLoading(true);
      setError(false);

      try {
        const results = await Promise.allSettled(
          feedTickers.map(async (ticker) => {
            const response = await fetch(
              `/api/stocks/${ticker}/news?surface=dashboard`,
              { signal: controller.signal }
            );
            const payload = (await response.json().catch(() => null)) as NewsResponse | null;

            if (!response.ok) {
              return [];
            }

            return (payload?.items ?? []).map((item) => ({
              ...item,
              ticker,
            }));
          })
        );

        if (controller.signal.aborted) {
          return;
        }

        const merged = results
          .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
          .filter((item): item is DashboardNewsItem => Boolean(item));

        setItems(dedupeNewsItems(merged).slice(0, 5));
        setError(results.every((result) => result.status === "rejected"));
      } catch {
        if (!controller.signal.aborted) {
          setItems([]);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadNews();

    return () => controller.abort();
  }, [feedTickers]);

  return (
    <Card
      variant="subtle"
      radius="xl"
      className="border-[rgba(108,155,205,0.26)] bg-[radial-gradient(circle_at_8%_0%,rgba(61,91,160,0.07),transparent_30%),linear-gradient(180deg,#102033_0%,#06101b_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      <CardHeader className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardEyebrow className="text-[#7bbcff]">
            <Newspaper className="h-3.5 w-3.5" />
            Market News
          </CardEyebrow>
          <NewsDataBadge loading={loading} error={error} hasItems={items.length > 0} />
        </div>
        <CardTitle className="text-[1.25rem]">Market News</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <NewsSkeleton />
        ) : error ? (
          <NewsState message="News temporarily unavailable" />
        ) : items.length ? (
          <div className="space-y-1">
            {items.map((item) => {
              const displaySource = item.source?.toLowerCase() === 'yahoo'
                ? 'Yahoo Finance'
                : item.source;

              return (
                <article
                  key={`${item.ticker}-${item.id}`}
                  className="border-b border-[rgba(70,105,150,0.16)] px-3 py-3 last:border-b-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" size="sm" className="normal-case tracking-normal">
                      {item.ticker}
                    </Badge>
                    <ClassificationBadge classification={item.classification} />
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-[0.94rem] font-medium leading-6 text-[#f2f7ff] transition hover:text-[#75e7dc]"
                  >
                    {item.headline}
                  </a>
                  <p className="mt-1 text-body-sm text-[#7891ad]">
                    {displaySource} - {formatTimeAgo(item.publishedAt)}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <NewsState message="No top market news available right now" />
        )}
      </CardContent>
    </Card>
  );
}

function NewsDataBadge({
  loading,
  error,
  hasItems,
}: {
  loading: boolean;
  error: boolean;
  hasItems: boolean;
}) {
  if (error || (!loading && !hasItems)) {
    return (
      <Badge variant="ai" size="sm" className="normal-case tracking-normal">
        Data limited
      </Badge>
    );
  }

  return (
    <Badge variant="outline" size="sm" className="normal-case tracking-normal">
      {loading ? "Provider context" : "Live"}
    </Badge>
  );
}

function ClassificationBadge({
  classification,
}: {
  classification: NewsClassification;
}) {
  if (classification === "company_specific") {
    return (
      <Badge variant="accent" size="sm" className="normal-case tracking-normal">
        Company
      </Badge>
    );
  }

  if (classification === "sector_wide") {
    return (
      <Badge variant="ai" size="sm" className="normal-case tracking-normal">
        Sector
      </Badge>
    );
  }

  return (
    <Badge variant="outline" size="sm" className="normal-case tracking-normal">
      Market
    </Badge>
  );
}

function NewsSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="border-b border-[rgba(70,105,150,0.16)] px-3 py-3 last:border-b-0">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton shape="text" className="mt-3 h-5 w-full" />
          <Skeleton shape="text" className="mt-2 h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

function NewsState({ message }: { message: string }) {
  return (
    <div className="rounded-[0.8rem] border border-[#213d63]/72 bg-[#0d1b2e] px-4 py-5 text-body-sm text-[#91a9c6]">
      {message}
    </div>
  );
}

function normalizeTickers(tickers: string[]) {
  const normalized = tickers
    .map((ticker) => ticker.trim().toUpperCase())
    .filter((ticker) => /^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker));

  return Array.from(new Set([...normalized, ...fallbackTickers])).slice(0, 4);
}

function dedupeNewsItems(items: DashboardNewsItem[]) {
  const seen = new Set<string>();

  return [...items]
    .sort(
      (a, b) =>
        b.relevanceScore - a.relevanceScore ||
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .filter((item) => {
      const key = normalizeHeadline(item.headline).slice(0, 60);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function normalizeHeadline(headline: string) {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTimeAgo(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "recently";
  }

  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
