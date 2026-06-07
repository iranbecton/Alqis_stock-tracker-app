"use client";

import { useCallback, useEffect, useState } from "react";
import { SessionTabs } from "@/components/dashboard/session-tabs";
import { TodayHero, type DailyBriefResponse } from "@/components/dashboard/today-hero";

type DashboardBriefCoordinatorProps = {
  generatedAt: string;
  defaultTicker: string;
  watchlistCount: number;
  userName?: string;
  portfolioTickers?: string[];
  fallbackTickers?: string[];
  compact?: boolean;
};

export function DashboardBriefCoordinator({
  generatedAt,
  defaultTicker,
  watchlistCount,
  userName,
  portfolioTickers = [],
  fallbackTickers = [],
  compact = false,
}: DashboardBriefCoordinatorProps) {
  const [brief, setBrief] = useState<DailyBriefResponse | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [isBriefLoading, setIsBriefLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBrief = useCallback(async (forceRefresh: boolean) => {
    setBriefError(null);
    setIsBriefLoading(!forceRefresh);
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
      setBriefError(
        requestError instanceof Error
          ? requestError.message
          : "Daily brief unavailable."
      );
    } finally {
      setIsBriefLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadBrief(false);
  }, [loadBrief]);

  return (
    <>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SessionTabs brief={brief} />
        <p className="text-body-sm text-[#5f7898]">
          {userName ? `${userName}: ` : ""}Tech & AI / Semiconductors / Market context
        </p>
      </div>

      <TodayHero
        generatedAt={generatedAt}
        defaultTicker={defaultTicker}
        watchlistCount={watchlistCount}
        userName={userName}
        portfolioTickers={portfolioTickers}
        fallbackTickers={fallbackTickers}
        brief={brief}
        briefError={briefError}
        isBriefLoading={isBriefLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => void loadBrief(true)}
        compact={compact}
      />
    </>
  );
}
