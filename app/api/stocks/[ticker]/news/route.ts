import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { newsCacheKey, newsSurfaceCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import {
  recordCacheOutcome,
  recordRefreshCooldown,
  recordRouteEvent,
} from "@/lib/diagnostics/observability";
import {
  logServerError,
  normalizedApiError,
  rateLimitedResponse,
} from "@/lib/errors/api-error";
import { getFinnhubCompanyProfile } from "@/lib/market-data/finnhub";
import { filterAndRankNews } from "@/lib/news/classify";
import { filterCompanyNews, getFinnhubCompanyNews } from "@/lib/news/finnhub";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import {
  getRateLimitKey,
  isRefreshRequest,
  rateLimit,
  RATE_LIMITS,
  refreshCooldown,
  REFRESH_COOLDOWNS,
} from "@/lib/security/rate-limit";

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};
const ROUTE = "/api/stocks/[ticker]/news";
const SURFACE_CONFIG = {
  stock: { limit: 8, minRelevance: 0.45 },
  dashboard: { limit: 5, minRelevance: 0.6 },
} as const;
type NewsSurface = keyof typeof SURFACE_CONFIG;

export async function GET(request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const symbol = normalizeTicker(ticker);
  const forceRefresh = isRefreshRequest(request);
  const surface = getNewsSurface(request);
  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
    ticker: symbol,
    refreshRequested: forceRefresh,
  });
  const limit = await rateLimit(
    getRateLimitKey(request, null, forceRefresh ? "news-refresh" : "news"),
    forceRefresh ? RATE_LIMITS.marketDataRefresh : RATE_LIMITS.marketData
  );

  if (!limit.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "GET",
      ticker: symbol,
      refreshRequested: forceRefresh,
    });
    return rateLimitedResponse(limit.resetAt);
  }

  if (!isValidTicker(symbol)) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "GET",
      ticker: symbol,
      reason: "invalid_ticker",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Invalid ticker symbol.",
    });
  }

  const refreshWindow = forceRefresh
    ? await refreshCooldown(
        getRateLimitKey(request, null, `news-refresh-window:${symbol}`),
        REFRESH_COOLDOWNS.marketData
      )
    : { allowed: true };
  recordRefreshCooldown({
    route: ROUTE,
    requested: forceRefresh,
    allowed: refreshWindow.allowed,
    method: "GET",
    ticker: symbol,
  });
  const effectiveForceRefresh = forceRefresh && refreshWindow.allowed;

  if (surface) {
    return getSurfaceNewsResponse({
      symbol,
      surface,
      forceRefresh,
      effectiveForceRefresh,
    });
  }

  try {
    const { data, meta } = await withCache(
      newsCacheKey(symbol),
      CACHE_TTL.news,
      async () => {
        if (process.env.NODE_ENV === "development") {
          console.error("[ALQIS news] Provider fetch after cache miss", {
            provider: "finnhub",
            ticker: symbol,
          });
        }

        const [items, profile] = await Promise.all([
          getFinnhubCompanyNews(symbol),
          getFinnhubCompanyProfile(symbol).catch(() => null),
        ]);
        const filteredItems = filterCompanyNews(items, symbol, profile?.companyName);

        return {
          symbol,
          items: filteredItems.slice(0, 8),
          status: filteredItems.length > 0 ? "ok" : "empty",
          filteredOut: Math.max(items.length - filteredItems.length, 0),
        };
      },
      { forceRefresh: effectiveForceRefresh }
    );
    recordCacheOutcome(ROUTE, meta, {
      method: "GET",
      ticker: symbol,
      provider: "finnhub",
      refreshRequested: forceRefresh,
      refreshAllowed: effectiveForceRefresh,
      status: data.status,
    });

    return NextResponse.json({
      ...data,
      ...meta,
    });
  } catch (error) {
    logServerError("[ALQIS news] Provider request failed", {
      provider: "finnhub",
      ticker: symbol,
      reason: error instanceof Error ? error.message : "Unknown news error",
    });

    recordRouteEvent({
      category: "provider_error_sanitized",
      route: ROUTE,
      method: "GET",
      ticker: symbol,
      provider: "finnhub",
      reason: "news_provider_unavailable",
    });

    return normalizedApiError({
      code: "PROVIDER_UNAVAILABLE",
      message: "News provider unavailable.",
      extra: {
        symbol,
        items: [],
      },
    });
  }
}

async function getSurfaceNewsResponse({
  symbol,
  surface,
  forceRefresh,
  effectiveForceRefresh,
}: {
  symbol: string;
  surface: NewsSurface;
  forceRefresh: boolean;
  effectiveForceRefresh: boolean;
}) {
  const config = SURFACE_CONFIG[surface];

  try {
    const { data, meta } = await withCache(
      newsSurfaceCacheKey(symbol, surface),
      CACHE_TTL.newsSurface,
      async () => {
        if (process.env.NODE_ENV === "development") {
          console.error("[ALQIS news] Provider fetch after surface cache miss", {
            provider: "finnhub",
            ticker: symbol,
            surface,
          });
        }

        const [items, profile] = await Promise.all([
          getFinnhubCompanyNews(symbol),
          getFinnhubCompanyProfile(symbol).catch(() => null),
        ]);
        const rankedItems = filterAndRankNews(
          items,
          symbol,
          profile?.sector,
          config.limit,
          {
            minRelevance: config.minRelevance,
            companyName: profile?.companyName,
          }
        );

        return {
          symbol,
          surface,
          items: rankedItems,
          status: rankedItems.length > 0 ? "ok" : "empty",
          filteredOut: Math.max(items.length - rankedItems.length, 0),
        };
      },
      { forceRefresh: effectiveForceRefresh }
    );

    recordCacheOutcome(ROUTE, meta, {
      method: "GET",
      ticker: symbol,
      provider: "finnhub",
      refreshRequested: forceRefresh,
      refreshAllowed: effectiveForceRefresh,
      status: data.status,
    });

    return NextResponse.json({
      ...data,
      ...meta,
    });
  } catch (error) {
    logServerError("[ALQIS news] Provider request failed", {
      provider: "finnhub",
      ticker: symbol,
      surface,
      reason: error instanceof Error ? error.message : "Unknown news error",
    });

    recordRouteEvent({
      category: "provider_error_sanitized",
      route: ROUTE,
      method: "GET",
      ticker: symbol,
      provider: "finnhub",
      reason: "news_provider_unavailable",
    });

    return normalizedApiError({
      code: "PROVIDER_UNAVAILABLE",
      message: "News provider unavailable.",
      extra: {
        symbol,
        surface,
        items: [],
      },
    });
  }
}

function getNewsSurface(request: Request): NewsSurface | null {
  const surface = new URL(request.url).searchParams.get("surface");

  if (surface === "stock" || surface === "dashboard") {
    return surface;
  }

  return null;
}
