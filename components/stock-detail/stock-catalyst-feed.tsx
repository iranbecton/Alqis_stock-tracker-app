"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ConfidenceDot, type ConfidenceBand } from "@/components/ui/confidence-dot";
import { Skeleton } from "@/components/ui/skeleton";
import type { NewsClassification, ScoredNewsItem } from "@/lib/news/classify";

type NewsResponse = {
  items?: ScoredNewsItem[];
};

export function StockCatalystFeed({
  ticker,
  compact = false,
}: {
  ticker: string;
  compact?: boolean;
}) {
  const [items, setItems] = useState<ScoredNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const symbol = ticker.trim().toUpperCase();

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(`/api/stocks/${symbol}/news?surface=stock`, {
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as NewsResponse | null;

        if (!response.ok) {
          throw new Error("News unavailable.");
        }

        setItems((payload?.items ?? []).slice(0, 8));
      } catch {
        if (!controller.signal.aborted) {
          setError(true);
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadNews();

    return () => controller.abort();
  }, [symbol]);

  if (loading) {
    return <CatalystSkeleton />;
  }

  if (error) {
    return <CatalystState message="News temporarily unavailable" />;
  }

  if (!items.length) {
    return <CatalystState message={`No recent catalyst news for ${symbol}`} />;
  }

  return (
    <div className={compact ? "grid gap-2.5 xl:grid-cols-2" : "grid gap-2.5 xl:grid-cols-2"}>
      {items.map((item) => {
        const displaySource = item.source?.toLowerCase() === 'yahoo'
          ? 'Yahoo Finance'
          : item.source;

        return (
          <article
            key={item.id}
            className="rounded-[0.85rem] border border-[#446890]/32 bg-[#07111f]/68 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <ClassificationBadge classification={item.classification} />
              <ConfidenceDot
                band={scoreToBand(item.relevanceScore)}
                showLabel={false}
                className="rounded-full border border-border/50 bg-surface/42 px-2 py-1"
                title={`Relevance score ${Math.round(item.relevanceScore * 100)}%`}
              />
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block text-base font-medium leading-6 tracking-tight text-ink transition hover:text-accent"
            >
              {item.headline}
            </a>
            <p className="mt-2 text-body-sm text-ink-subtle">
              {displaySource} - {formatTimeAgo(item.publishedAt)}
            </p>
          </article>
        );
      })}
    </div>
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

function CatalystSkeleton() {
  return (
    <div className="grid gap-2.5 xl:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="rounded-[0.85rem] border border-[#446890]/32 bg-[#07111f]/68 p-3"
        >
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton shape="text" className="mt-4 h-5 w-full" />
          <Skeleton shape="text" className="mt-2 h-5 w-4/5" />
          <Skeleton shape="text" className="mt-3 h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

function CatalystState({ message }: { message: string }) {
  return (
    <div className="rounded-[0.85rem] border border-[#446890]/32 bg-[#07111f]/68 px-4 py-6 text-body-sm text-ink-muted">
      {message}
    </div>
  );
}

function scoreToBand(score: number): ConfidenceBand {
  if (score >= 0.85) return "A";
  if (score >= 0.65) return "B";
  if (score >= 0.45) return "C";
  return "D";
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
