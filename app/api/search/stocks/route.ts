import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { searchCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import { searchFinnhubSymbols } from "@/lib/market-data/finnhub";
import { normalizeTicker } from "@/lib/market-data/validation";
import { stockUniverse } from "@/lib/stocks/stock-universe";

type SearchResult = {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
  currency: string;
  source: "finnhub" | "local";
};

const MAX_RESULTS = 10;
const SUPPORTED_SYMBOL_PATTERN = /^[A-Z][A-Z0-9-]{0,9}$/;
const US_EXCHANGE_HINTS = [
  "NASDAQ",
  "NYSE",
  "NYSE ARCA",
  "AMEX",
  "ARCX",
  "XNAS",
  "XNYS",
  "BATS",
];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!query) {
    return NextResponse.json({
      results: getLocalResults("").slice(0, MAX_RESULTS),
      providerStatus: "fallback",
      cacheStatus: "unavailable",
    });
  }

  const { data, meta } = await withCache(
    searchCacheKey(query),
    CACHE_TTL.search,
    () => searchStocks(query),
    { forceRefresh }
  );

  return NextResponse.json({
    ...data,
    ...meta,
  });
}

async function searchStocks(query: string): Promise<SearchResponse> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS search] Provider fetch after cache miss", {
        provider: "finnhub",
        query,
      });
    }

    const finnhubResults = dedupeResults(
      (await searchFinnhubSymbols(query))
        .map((item): SearchResult => ({
          ticker: normalizeTicker(item.ticker),
          name: item.name,
          exchange: item.exchange ?? "",
          type: item.type ?? "Common Stock",
          currency: item.currency ?? "USD",
          source: "finnhub",
        }))
        .filter(isSupportedResult)
    ).slice(0, MAX_RESULTS);

    if (finnhubResults.length) {
      return {
        results: finnhubResults,
        providerStatus: "ok",
      };
    }

    return {
      results: getLocalResults(query).slice(0, MAX_RESULTS),
      providerStatus: "fallback",
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS search] Finnhub symbol search failed", {
        query,
        error,
      });
    }

    return {
      results: getLocalResults(query).slice(0, MAX_RESULTS),
      providerStatus: "fallback",
    };
  }
}

type SearchResponse = {
  results: SearchResult[];
  providerStatus: "ok" | "fallback" | "error";
};

function getLocalResults(query: string): SearchResult[] {
  const normalizedQuery = query.trim().toUpperCase();

  return stockUniverse
    .map((item) => ({
      item,
      score: getLocalScore(item.ticker, item.companyName, normalizedQuery),
    }))
    .filter(({ score }) => score > 0 || !normalizedQuery)
    .sort((a, b) => b.score - a.score || a.item.ticker.localeCompare(b.item.ticker))
    .map(({ item }) => ({
      ticker: item.ticker,
      name: item.companyName,
      exchange: item.exchange,
      type: item.type,
      currency: item.currency,
      source: "local" as const,
    }));
}

function getLocalScore(ticker: string, name: string, query: string) {
  if (!query) return 1;

  const upperName = name.toUpperCase();

  if (ticker === query) return 100;
  if (ticker.startsWith(query)) return 90;
  if (upperName.startsWith(query)) return 80;
  if (ticker.includes(query)) return 70;
  if (upperName.includes(query)) return 60;

  return 0;
}

function isSupportedResult(result: SearchResult) {
  if (!result.ticker || !result.name) return false;
  if (!SUPPORTED_SYMBOL_PATTERN.test(result.ticker)) return false;
  if (result.ticker.includes(".") || result.ticker.includes("/")) return false;
  if (result.currency && result.currency !== "USD") return false;

  const exchange = result.exchange.toUpperCase();

  if (!exchange) return true;

  return US_EXCHANGE_HINTS.some((hint) => exchange.includes(hint));
}

function dedupeResults(results: SearchResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    if (seen.has(result.ticker)) {
      return false;
    }

    seen.add(result.ticker);
    return true;
  });
}
