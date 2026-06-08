import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { chartCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import {
  recordCacheOutcome,
  recordRefreshCooldown,
  recordRouteEvent,
} from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import { twelveDataChartProvider } from "@/lib/market-data/twelve-data";
import {
  isValidTicker,
  normalizeTicker,
  parseChartRange,
} from "@/lib/market-data/validation";
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
const ROUTE = "/api/stocks/[ticker]/chart";

export async function GET(request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const symbol = normalizeTicker(ticker);
  const { searchParams } = new URL(request.url);
  const range = parseChartRange(searchParams.get("range"));
  const forceRefresh = isRefreshRequest(request);
  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
    ticker: symbol,
    range,
    refreshRequested: forceRefresh,
  });
  const limit = await rateLimit(
    getRateLimitKey(
      request,
      null,
      forceRefresh ? "chart-refresh" : "chart"
    ),
    forceRefresh ? RATE_LIMITS.marketDataRefresh : RATE_LIMITS.marketData
  );

  if (!limit.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "GET",
      ticker: symbol,
      range,
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

  if (!range) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "GET",
      ticker: symbol,
      reason: "invalid_chart_range",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Unsupported chart range. Use 1D, 5D, or 1M.",
    });
  }

  const refreshWindow = forceRefresh
    ? await refreshCooldown(
        getRateLimitKey(
          request,
          null,
          `chart-refresh-window:${symbol}:${range}`
        ),
        REFRESH_COOLDOWNS.marketData
      )
    : { allowed: true };
  recordRefreshCooldown({
    route: ROUTE,
    requested: forceRefresh,
    allowed: refreshWindow.allowed,
    method: "GET",
    ticker: symbol,
    range,
  });
  const effectiveForceRefresh = forceRefresh && refreshWindow.allowed;

  try {
    const { data: result, meta } = await withCache(
      chartCacheKey(symbol, range),
      CACHE_TTL.chart,
      async () => {
        if (process.env.NODE_ENV === "development") {
          console.error("[ALQIS chart route] Provider fetch after cache miss", {
            provider: "twelve-data",
            symbol,
            range,
          });
        }

        return twelveDataChartProvider.getCandles(symbol, range);
      },
      {
        forceRefresh: effectiveForceRefresh,
        shouldCache: (data) => {
          const result = data as Awaited<
            ReturnType<typeof twelveDataChartProvider.getCandles>
          >;
          return result.status === "ok" || result.status === "empty";
        },
      }
    );
    recordCacheOutcome(ROUTE, meta, {
      method: "GET",
      ticker: symbol,
      range,
      provider: result.provider,
      refreshRequested: forceRefresh,
      refreshAllowed: effectiveForceRefresh,
      status: result.status,
    });

    if (result.status !== "ok" && result.status !== "empty") {
      if (process.env.NODE_ENV === "development") {
        console.error("[ALQIS chart route] Chart provider fallback", {
          provider: result.provider,
          symbol,
          range,
          status: result.status,
          category: result.providerRateLimited
            ? "chart_rate_limited"
            : "chart_provider_unavailable",
        });
      }

      recordRouteEvent({
        category: "provider_error_sanitized",
        route: ROUTE,
        method: "GET",
        ticker: symbol,
        range,
        provider: result.provider,
        status: result.status,
        reason: result.providerRateLimited
          ? "chart_rate_limited"
          : "chart_provider_unavailable",
      });

      return normalizedApiError({
        code: result.providerRateLimited
          ? "RATE_LIMITED"
          : "PROVIDER_UNAVAILABLE",
        message: result.providerRateLimited
          ? "Chart data temporarily unavailable. Please retry."
          : "Chart data unavailable.",
        status: result.providerRateLimited ? 429 : 502,
        extra: {
          fallback: "demo-chart-structure",
          symbol,
          range,
          ...meta,
          points: [],
          status: "data_unavailable",
        },
      });
    }

    if (result.status === "empty") {
      recordRouteEvent({
        category: "provider_fallback",
        route: ROUTE,
        method: "GET",
        ticker: symbol,
        range,
        provider: result.provider,
        reason: "empty_chart_points",
      });
    }

    return NextResponse.json({
      symbol,
      range,
      provider: result.provider,
      points: result.points,
      status: result.status,
      fallback: result.points.length > 0 ? null : "demo-chart-structure",
      ...meta,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      void error;
      console.error("[ALQIS chart route] Unexpected chart provider failure", {
        provider: "twelve-data",
        symbol,
        range,
        category: "unexpected_chart_provider_failure",
      });
    }

    recordRouteEvent({
      category: "provider_error_sanitized",
      route: ROUTE,
      method: "GET",
      ticker: symbol,
      range,
      provider: "twelve-data",
      reason: "unexpected_chart_provider_failure",
    });

    return normalizedApiError({
      code: "PROVIDER_UNAVAILABLE",
      message: "Chart data unavailable.",
      extra: {
        fallback: "demo-chart-structure",
        symbol,
        range,
        points: [],
        status: "data_unavailable",
      },
    });
  }
}
