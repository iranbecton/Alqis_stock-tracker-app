import { NextResponse } from "next/server";
import {
  getFinnhubCompanyProfile,
  getFinnhubQuote,
} from "@/lib/market-data/finnhub";
import { quoteCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import { withCache } from "@/lib/cache";
import {
  recordCacheOutcome,
  recordRefreshCooldown,
  recordRouteEvent,
} from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
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
const ROUTE = "/api/stocks/[ticker]/quote";

export async function GET(request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const symbol = normalizeTicker(ticker);
  const forceRefresh = isRefreshRequest(request);
  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
    ticker: symbol,
    refreshRequested: forceRefresh,
  });
  const limit = await rateLimit(
    getRateLimitKey(
      request,
      null,
      forceRefresh ? "quote-refresh" : "quote"
    ),
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
        getRateLimitKey(request, null, `quote-refresh-window:${symbol}`),
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

  try {
    const { data, meta } = await withCache(
      quoteCacheKey(symbol),
      CACHE_TTL.quote,
      async () => {
        if (process.env.NODE_ENV === "development") {
          console.error("[ALQIS quote] Provider fetch after cache miss", {
            provider: "finnhub",
            ticker: symbol,
          });
        }

        const [quote, profile] = await Promise.all([
          getFinnhubQuote(symbol),
          getFinnhubCompanyProfile(symbol).catch(() => null),
        ]);

        return {
          ...quote,
          companyProfile: profile,
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
    });

    return NextResponse.json({
      ...data,
      ...meta,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS quote] Provider request failed", {
        provider: "finnhub",
        ticker: symbol,
        failedEndpoint: "/api/stocks/[ticker]/quote",
        reason: error instanceof Error ? error.message : "Unknown quote error",
        fallbackUsed: false,
      });
    }

    recordRouteEvent({
      category: "provider_error_sanitized",
      route: ROUTE,
      method: "GET",
      ticker: symbol,
      provider: "finnhub",
      reason: "quote_provider_unavailable",
    });

    return normalizedApiError({
      code: "PROVIDER_UNAVAILABLE",
      message: "Quote provider unavailable.",
      extra: {
        symbol,
      },
    });
  }
}
