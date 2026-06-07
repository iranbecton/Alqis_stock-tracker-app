"use client";

import { useEffect, useState } from "react";
import { RadioTower } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SectorCascade = {
  sectorRead: {
    sector: string;
    realtimeChange: number;
    direction: "up" | "down";
    summary: string;
    confidence: "high" | "moderate" | "low";
    fetchedAt: string;
  };
  exposedTickers: string[];
};

type SectorCascadeResponse =
  | {
      triggered: false;
      sectors: [];
    }
  | {
      triggered: true;
      cascades: SectorCascade[];
    };

export function SectorCascadeFeed() {
  const [cascades, setCascades] = useState<SectorCascade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const skeletonTimer = window.setTimeout(() => {
      setShowSkeleton(false);
    }, 1500);

    async function loadSectorCascade() {
      try {
        const response = await fetch("/api/market/sector-cascade", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Sector cascade unavailable.");
        }

        const payload = (await response.json()) as SectorCascadeResponse;

        if (!controller.signal.aborted && payload.triggered) {
          setCascades(payload.cascades ?? []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setCascades([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadSectorCascade();

    return () => {
      controller.abort();
      window.clearTimeout(skeletonTimer);
    };
  }, []);

  if (loading && showSkeleton) {
    return <SectorCascadeSkeleton />;
  }

  if (!cascades.length) {
    return null;
  }

  return (
    <Card
      variant="subtle"
      radius="xl"
      className="border-[rgba(108,155,205,0.26)] bg-[radial-gradient(circle_at_12%_0%,rgba(139,132,199,0.12),transparent_28%),linear-gradient(180deg,#102033_0%,#06101b_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]"
    >
      <CardHeader className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardEyebrow className="text-[#7bbcff]">
            <RadioTower className="h-3.5 w-3.5" />
            Sector Intelligence
          </CardEyebrow>
          <Badge variant="outline" size="sm" className="normal-case tracking-normal">
            Provider context
          </Badge>
        </div>
        <CardTitle className="text-[1.25rem]">Sector movement near your tickers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-[rgba(70,105,150,0.18)]">
          {cascades.map((item) => {
            const isUp = item.sectorRead.direction === "up";

            return (
              <article key={item.sectorRead.sector} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#f2f7ff]">
                      {item.sectorRead.sector}
                    </p>
                    <p
                      className={
                        isUp
                          ? "mt-0.5 text-sm font-semibold text-[var(--positive)]"
                          : "mt-0.5 text-sm font-semibold text-[var(--negative)]"
                      }
                      data-numeric
                    >
                      {formatPercent(item.sectorRead.realtimeChange)}
                    </p>
                  </div>
                  <Badge variant="ai" size="sm" className="normal-case tracking-normal">
                    {formatConfidence(item.sectorRead.confidence)}
                  </Badge>
                </div>
                <p className="mt-3 text-body-sm leading-6 text-[#a7b7cc]">
                  {item.sectorRead.summary}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#7891ad]">
                    Your watchlist/holdings include:
                  </span>
                  {item.exposedTickers.map((ticker) => (
                    <span
                      key={`${item.sectorRead.sector}-${ticker}`}
                      className="rounded-full border border-[rgba(117,231,220,0.22)] bg-[rgba(7,17,31,0.62)] px-2.5 py-1 text-[0.72rem] font-semibold text-[#d9e9ff]"
                    >
                      {ticker}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-4 rounded-[0.75rem] border border-[rgba(210,169,107,0.22)] bg-[rgba(56,42,23,0.22)] px-3 py-2 text-[0.74rem] leading-5 text-[#a7b7cc]">
          Sector movement observations are informational only and do not constitute investment advice.
        </p>
      </CardContent>
    </Card>
  );
}

function SectorCascadeSkeleton() {
  return (
    <Card
      variant="subtle"
      radius="xl"
      className="border-[rgba(108,155,205,0.22)] bg-[linear-gradient(180deg,#102033_0%,#06101b_100%)]"
    >
      <CardHeader className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton shape="text" className="h-4 w-36" />
          <Skeleton shape="text" className="h-5 w-28 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {[0, 1].map((item) => (
          <div key={item} className="space-y-2 border-b border-[rgba(70,105,150,0.14)] pb-3 last:border-b-0">
            <div className="flex items-center justify-between gap-3">
              <Skeleton shape="text" className="h-5 w-40" />
              <Skeleton shape="text" className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton shape="text" className="h-4 w-full" />
            <Skeleton shape="text" className="h-4 w-3/4" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatPercent(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function formatConfidence(value: SectorCascade["sectorRead"]["confidence"]) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
