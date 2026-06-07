import { withCache } from "@/lib/cache";
import type { SectorPerformance } from "@/lib/market/sectors";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";

export type SectorTickerMapping = {
  sector: SectorPerformance;
  tickers: string[];
};

export const SECTOR_NORMALIZATION: Record<string, string> = {
  "Information Technology": "Technology",
  "Health Care": "Healthcare",
  Financials: "Financial Services",
  Energy: "Energy",
  Industrials: "Industrials",
  "Consumer Discretionary": "Consumer Cyclical",
  "Consumer Staples": "Consumer Defensive",
  Utilities: "Utilities",
  Materials: "Basic Materials",
  "Real Estate": "Real Estate",
  "Communication Services": "Communication Services",
};

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const TICKER_SECTOR_TTL_SECONDS = 24 * 60 * 60;
const FINNHUB_INDUSTRY_TO_ALPHA_SECTOR: Record<string, string> = {
  semiconductors: "Information Technology",
  software: "Information Technology",
  "technology hardware": "Information Technology",
  "electronic technology": "Information Technology",
  biotechnology: "Health Care",
  pharmaceuticals: "Health Care",
  "medical equipment": "Health Care",
  banking: "Financials",
  banks: "Financials",
  insurance: "Financials",
  "capital markets": "Financials",
  automobiles: "Consumer Discretionary",
  "auto manufacturers": "Consumer Discretionary",
  retail: "Consumer Discretionary",
  entertainment: "Communication Services",
  media: "Communication Services",
  telecom: "Communication Services",
  "oil and gas": "Energy",
};

type FinnhubProfileRecord = Record<string, unknown>;

export async function resolveSectorForTicker(
  ticker: string
): Promise<string | null> {
  const symbol = normalizeTicker(ticker);

  if (!isValidTicker(symbol)) {
    return null;
  }

  try {
    const { data } = await withCache(
      `sector:ticker:${symbol}`,
      TICKER_SECTOR_TTL_SECONDS,
      () => fetchTickerSector(symbol)
    );

    return data;
  } catch {
    return null;
  }
}

export async function mapTickersToTriggeredSectors(
  tickers: string[],
  triggeredSectors: SectorPerformance[]
): Promise<SectorTickerMapping[]> {
  const uniqueTickers = Array.from(
    new Set(
      tickers
        .map((ticker) => normalizeTicker(ticker))
        .filter((ticker) => isValidTicker(ticker))
    )
  );

  if (!uniqueTickers.length || !triggeredSectors.length) {
    return [];
  }

  const resolved = await Promise.all(
    uniqueTickers.map(async (ticker) => ({
      ticker,
      sector: await resolveSectorForTicker(ticker),
    }))
  );

  return triggeredSectors
    .map((sector) => ({
      sector,
      tickers: resolved
        .filter((item) => item.sector === sector.sector)
        .map((item) => item.ticker),
    }))
    .filter((item) => item.tickers.length > 0);
}

async function fetchTickerSector(symbol: string): Promise<string | null> {
  const apiKey = process.env.FINNHUB_API_KEY?.trim();

  if (!apiKey) {
    logSectorMapIssue("missing_api_key", symbol);
    return null;
  }

  try {
    const url = new URL(`${FINNHUB_BASE_URL}/stock/profile2`);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("token", apiKey);

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      logSectorMapIssue("http_error", symbol, response.status);
      return null;
    }

    const payload: unknown = await response.json();

    if (!isRecord(payload)) {
      logSectorMapIssue("malformed_profile", symbol);
      return null;
    }

    const rawSector =
      stringValue(payload.sector) ?? stringValue(payload.finnhubIndustry);

    return rawSector ? normalizeSectorName(rawSector) : null;
  } catch {
    logSectorMapIssue("fetch_failed", symbol);
    return null;
  }
}

function normalizeSectorName(value: string) {
  const normalized = normalizeComparable(value);
  const directAlphaSector = Object.keys(SECTOR_NORMALIZATION).find(
    (sector) => normalizeComparable(sector) === normalized
  );

  if (directAlphaSector) {
    return directAlphaSector;
  }

  const mappedFromFinnhubSector = Object.entries(SECTOR_NORMALIZATION).find(
    ([, finnhubSector]) => normalizeComparable(finnhubSector) === normalized
  )?.[0];

  if (mappedFromFinnhubSector) {
    return mappedFromFinnhubSector;
  }

  return FINNHUB_INDUSTRY_TO_ALPHA_SECTOR[normalized] ?? null;
}

function normalizeComparable(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function isRecord(value: unknown): value is FinnhubProfileRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function logSectorMapIssue(reason: string, ticker: string, status?: number) {
  console.error("[ALQIS sector map] Profile sector unavailable", {
    provider: "finnhub",
    ticker,
    reason,
    status,
  });
}
