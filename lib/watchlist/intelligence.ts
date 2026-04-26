import { headers } from "next/headers";
import type { AIWordingRouteResponse } from "@/lib/ai/providers/types";
import type { WhyMovingResponse } from "@/lib/ai/types";
import type { CompanyProfile, StockQuote } from "@/lib/market-data/types";
import { evaluateStockDataHealth } from "@/lib/stocks/stock-data-health";
import type {
  WatchlistApiItem,
  WatchlistDirection,
  WatchlistIntelligenceItem,
} from "@/lib/watchlist/types";

type QuotePayload = StockQuote & {
  companyProfile?: CompanyProfile | null;
  error?: string;
};

type ExplainPayload = WhyMovingResponse | AIWordingRouteResponse | { error?: string };

const WATCHLIST_INTELLIGENCE_CACHE_TTL_MS = 60_000;

const cache = new Map<
  string,
  {
    expiresAt: number;
    item: WatchlistIntelligenceItem;
  }
>();

export async function enrichWatchlistItems(
  items: WatchlistApiItem[]
): Promise<WatchlistIntelligenceItem[]> {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const cookie = headerList.get("cookie") ?? "";

  if (!host) {
    return items.map((item) => createUnavailableItem(item));
  }

  const baseUrl = `${protocol}://${host}`;

  return Promise.all(
    items.map((item) => enrichWatchlistItem(item, baseUrl, cookie))
  );
}

async function enrichWatchlistItem(
  item: WatchlistApiItem,
  baseUrl: string,
  cookie: string
): Promise<WatchlistIntelligenceItem> {
  const cacheKey = `${item.ticker}:${item.createdAt}`;
  const cached = getCachedItem(cacheKey);

  if (cached) {
    return cached;
  }

  const [quoteResult, explanationResult] = await Promise.allSettled([
    fetchInternalJson<QuotePayload>(baseUrl, `/api/stocks/${item.ticker}/quote`, cookie),
    fetchInternalJson<ExplainPayload>(
      baseUrl,
      "/api/explain/why-moving",
      cookie,
      {
        method: "POST",
        body: JSON.stringify({
          ticker: item.ticker,
          timeframe: "1D",
          useAIWording: true,
        }),
      }
    ),
  ]);
  const quote =
    quoteResult.status === "fulfilled" && quoteResult.value && "price" in quoteResult.value
      ? quoteResult.value
      : undefined;
  const explanation =
    explanationResult.status === "fulfilled"
      ? normalizeExplanation(explanationResult.value)
      : undefined;
  const dataHealth = evaluateStockDataHealth({
    quote,
    profile: quote?.companyProfile ?? null,
    news:
      explanation?.sourceCount && explanation.sourceCount > 0
        ? [
            {
              id: `${item.ticker}-structured-context`,
              headline: explanation.summary,
              summary: explanation.summary,
              source: "ALQIS structured read",
              url: "",
              publishedAt: explanation.generatedAt,
            },
          ]
        : [],
  });
  const providerStatus = getProviderStatus(dataHealth.overallStatus);
  const intelligenceItem: WatchlistIntelligenceItem = {
    id: item.id,
    ticker: item.ticker,
    companyName:
      quote?.companyProfile?.companyName ?? item.companyName ?? item.ticker,
    currentPrice: quote?.price ?? null,
    change: quote?.change ?? null,
    changePercent: quote?.changePercent ?? null,
    direction: getDirection(quote?.changePercent),
    sector: quote?.companyProfile?.sector ?? null,
    confidence: explanation?.confidence.label ?? null,
    readStatus: explanation
      ? "Structured read live"
      : dataHealth.overallStatus === "partial"
        ? "Partial market data"
        : dataHealth.userFacingLabel,
    quickRead: createQuickRead(item.ticker, quote, explanation),
    providerStatus,
  };

  setCachedItem(cacheKey, intelligenceItem);

  return intelligenceItem;
}

async function fetchInternalJson<T>(
  baseUrl: string,
  pathname: string,
  cookie: string,
  init?: RequestInit
): Promise<T | undefined> {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: init?.method ?? "GET",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      cookie,
      ...(init?.headers ?? {}),
    },
    body: init?.body,
  });
  const json = (await response.json()) as T;

  if (!response.ok) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Intelligence fetch failed", {
        pathname,
        status: response.status,
        json,
      });
    }

    return undefined;
  }

  return json;
}

function normalizeExplanation(payload: ExplainPayload | undefined): WhyMovingResponse | undefined {
  if (!payload || "error" in payload) {
    return undefined;
  }

  if ("structuredExplanation" in payload) {
    return payload.structuredExplanation;
  }

  if ("ticker" in payload && "confidence" in payload) {
    return payload;
  }

  return undefined;
}

function createQuickRead(
  ticker: string,
  quote?: QuotePayload,
  explanation?: WhyMovingResponse
) {
  if (explanation?.summary) {
    return truncateSentence(explanation.summary);
  }

  if (quote) {
    const direction = getDirection(quote.changePercent);
    const directionText =
      direction === "up" ? "higher" : direction === "down" ? "lower" : "little changed";

    return `${ticker} is ${directionText} today; open the full read for the latest ALQIS explanation.`;
  }

  return "Market data unavailable. Open the full read to refresh.";
}

function truncateSentence(value: string) {
  const firstSentence = value.split(/(?<=[.!?])\s+/)[0] ?? value;

  if (firstSentence.length <= 150) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, 147).trim()}...`;
}

function getDirection(value?: number): WatchlistDirection {
  if (typeof value !== "number" || Math.abs(value) < 0.05) {
    return "flat";
  }

  return value > 0 ? "up" : "down";
}

function getProviderStatus(
  overallStatus: ReturnType<typeof evaluateStockDataHealth>["overallStatus"]
): WatchlistIntelligenceItem["providerStatus"] {
  if (overallStatus === "complete") {
    return "ok";
  }

  if (overallStatus === "partial" || overallStatus === "limited") {
    return "partial";
  }

  return "unavailable";
}

function createUnavailableItem(item: WatchlistApiItem): WatchlistIntelligenceItem {
  return {
    id: item.id,
    ticker: item.ticker,
    companyName: item.companyName ?? item.ticker,
    currentPrice: null,
    change: null,
    changePercent: null,
    direction: "flat",
    sector: null,
    confidence: null,
    readStatus: "Market data unavailable",
    quickRead: "Market data unavailable. Open the full read to refresh.",
    providerStatus: "unavailable",
  };
}

function getCachedItem(key: string) {
  const cached = cache.get(key);

  if (!cached) {
    return undefined;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return cached.item;
}

function setCachedItem(key: string, item: WatchlistIntelligenceItem) {
  cache.set(key, {
    item,
    expiresAt: Date.now() + WATCHLIST_INTELLIGENCE_CACHE_TTL_MS,
  });
}
