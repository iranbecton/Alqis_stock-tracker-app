import { withCache } from "@/lib/cache";

export type SectorPerformance = {
  sector: string;
  realtimeChange: number;
  oneDayChange: number;
  triggered: boolean;
};

export type SectorFeedResult = {
  sectors: SectorPerformance[];
  triggeredSectors: SectorPerformance[];
  fetchedAt: string;
};

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";
const SECTOR_CACHE_KEY = "sectors:realtime";
const SECTOR_TTL_SECONDS = 15 * 60;
const TRIGGER_THRESHOLD = 1.5;
const ALPHA_VANTAGE_SECTORS = [
  "Information Technology",
  "Health Care",
  "Financials",
  "Energy",
  "Industrials",
  "Consumer Discretionary",
  "Consumer Staples",
  "Utilities",
  "Materials",
  "Real Estate",
  "Communication Services",
] as const;

type ProviderRecord = Record<string, unknown>;

export async function fetchSectorPerformance(): Promise<SectorFeedResult> {
  const { data } = await withCache(
    SECTOR_CACHE_KEY,
    SECTOR_TTL_SECONDS,
    fetchSectorPerformanceUncached
  );

  return data;
}

async function fetchSectorPerformanceUncached(): Promise<SectorFeedResult> {
  const fetchedAt = new Date().toISOString();
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY?.trim();

  if (!apiKey) {
    logSectorProviderIssue("missing_api_key");
    return emptySectorFeed(fetchedAt);
  }

  try {
    const url = new URL(ALPHA_VANTAGE_BASE_URL);
    url.searchParams.set("function", "SECTOR");
    url.searchParams.set("apikey", apiKey);

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      logSectorProviderIssue("http_error", response.status);
      return emptySectorFeed(fetchedAt);
    }

    const payload: unknown = await response.json();

    if (!isRecord(payload) || hasProviderNotice(payload)) {
      logSectorProviderIssue("provider_message");
      return emptySectorFeed(fetchedAt);
    }

    const realtime = payload["Rank A: Real-Time Performance"];
    const oneDay = payload["Rank B: 1 Day Performance"];

    if (!isRecord(realtime)) {
      logSectorProviderIssue("malformed_realtime");
      return emptySectorFeed(fetchedAt);
    }

    const sectors: SectorPerformance[] = [];

    ALPHA_VANTAGE_SECTORS.forEach((sector) => {
      const realtimeChange = parsePercent(realtime[sector]);
      const oneDayChange = isRecord(oneDay) ? parsePercent(oneDay[sector]) : 0;

      if (realtimeChange === null) {
        return;
      }

      sectors.push({
        sector,
        realtimeChange,
        oneDayChange: oneDayChange ?? 0,
        triggered: Math.abs(realtimeChange) >= TRIGGER_THRESHOLD,
      });
    });

    if (!sectors.length) {
      logSectorProviderIssue("malformed_sector_rows");
      return emptySectorFeed(fetchedAt);
    }

    return {
      sectors,
      triggeredSectors: sectors.filter((sector) => sector.triggered),
      fetchedAt,
    };
  } catch {
    logSectorProviderIssue("fetch_failed");
    return emptySectorFeed(fetchedAt);
  }
}

function emptySectorFeed(fetchedAt: string): SectorFeedResult {
  return {
    sectors: [],
    triggeredSectors: [],
    fetchedAt,
  };
}

function parsePercent(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value.replace("%", "").trim());

  return Number.isFinite(parsed) ? parsed : null;
}

function hasProviderNotice(payload: ProviderRecord) {
  return Boolean(
    payload["Error Message"] ||
      payload.Note ||
      payload.Information ||
      payload["Thank you for using Alpha Vantage!"]
  );
}

function isRecord(value: unknown): value is ProviderRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function logSectorProviderIssue(reason: string, status?: number) {
  console.error("[ALQIS sector performance] Provider unavailable", {
    provider: "alpha_vantage",
    reason,
    status,
  });
}
