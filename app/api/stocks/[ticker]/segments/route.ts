import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { segmentsCacheKey } from "@/lib/cache/keys";
import { recordCacheOutcome, recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import { getFMPRevenueProductSegmentation } from "@/lib/market-data/fmp";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};

type DataStatus = "live" | "data-limited" | "unavailable";

const ROUTE = "/api/stocks/[ticker]/segments";
const SEGMENTS_TTL_SECONDS = 120 * 60;

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({
      category: "auth_required_failed",
      route: ROUTE,
      method: "GET",
    });
    return auth.response;
  }

  const { ticker } = await context.params;
  const symbol = normalizeTicker(ticker);
  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
    ticker: symbol,
  });

  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "stock-segments"),
    RATE_LIMITS.marketData
  );

  if (!limit.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "GET",
      ticker: symbol,
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

  try {
    const { data, meta } = await withCache(
      segmentsCacheKey(symbol),
      SEGMENTS_TTL_SECONDS,
      async () => buildSegmentsPayload(symbol)
    );

    recordCacheOutcome(ROUTE, meta, {
      method: "GET",
      ticker: symbol,
      status: data.dataStatus,
    });

    return NextResponse.json({
      ...data,
      ...meta,
    });
  } catch {
    recordRouteEvent({
      category: "provider_error_sanitized",
      route: ROUTE,
      method: "GET",
      ticker: symbol,
      reason: "segment_provider_unavailable",
    });

    return NextResponse.json({
      symbol,
      dataStatus: "unavailable" satisfies DataStatus,
      period: null,
      items: [],
    });
  }
}

async function buildSegmentsPayload(symbol: string) {
  const periods = await getFMPRevenueProductSegmentation(symbol);
  const latest = periods[0] ?? null;

  if (!latest) {
    return {
      symbol,
      dataStatus: "unavailable" satisfies DataStatus,
      period: null,
      currency: null,
      items: [],
    };
  }

  const latestTotal = latest.segments.reduce((sum, item) => sum + item.revenue, 0);
  const items = latest.segments
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .map((segment) => {
      const previous = findPreviousSegmentRevenue(periods, latest.date, segment.name);
      const yoy =
        typeof previous === "number" && previous > 0
          ? ((segment.revenue - previous) / previous) * 100
          : null;

      return {
        name: segment.name,
        revenue: segment.revenue,
        share: latestTotal > 0 ? segment.revenue / latestTotal : null,
        yoy,
        trend: periods
          .slice(0, 8)
          .reverse()
          .map((period) => ({
            label: period.fiscalYear ? `FY${String(period.fiscalYear).slice(-2)}` : period.date,
            value:
              period.segments.find((item) => item.name === segment.name)?.revenue ?? null,
          })),
      };
    });

  return {
    symbol,
    dataStatus: items.length ? ("live" satisfies DataStatus) : ("unavailable" satisfies DataStatus),
    period: latest.fiscalYear ?? latest.date,
    currency: latest.reportedCurrency,
    items,
  };
}

function findPreviousSegmentRevenue(
  periods: Awaited<ReturnType<typeof getFMPRevenueProductSegmentation>>,
  latestDate: string | null,
  segmentName: string
) {
  const previous = periods.find((period) => {
    if (latestDate && period.date === latestDate) {
      return false;
    }

    return period.segments.some((segment) => segment.name === segmentName);
  });

  return previous?.segments.find((segment) => segment.name === segmentName)?.revenue ?? null;
}
