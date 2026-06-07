import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { earningsHistoryCacheKey } from "@/lib/cache/keys";
import { recordCacheOutcome, recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import { getFMPEarningsCalendar } from "@/lib/market-data/fmp";
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
type Verdict = "BEAT" | "MISSED" | "IN-LINE" | "PROVIDER LIMITED";

const ROUTE = "/api/stocks/[ticker]/history";
const HISTORY_TTL_SECONDS = 60 * 60;

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
    getRateLimitKey(request, auth.userId, "stock-history"),
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
      earningsHistoryCacheKey(symbol),
      HISTORY_TTL_SECONDS,
      async () => buildHistoryPayload(symbol)
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
      reason: "earnings_history_provider_unavailable",
    });

    return NextResponse.json({
      symbol,
      dataStatus: "unavailable" satisfies DataStatus,
      summary: `${symbol} earnings history is unavailable from the current provider.`,
      rows: [],
    });
  }
}

async function buildHistoryPayload(symbol: string) {
  const earnings = (await getFMPEarningsCalendar(symbol))
    .filter((item) => item.date && isPastOrToday(item.date))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 8);

  const rows = earnings.map((item) => {
    const verdict = getVerdict(item.epsActual, item.epsEstimated);

    return {
      quarter: getQuarterLabel(item.date),
      date: item.date,
      epsActual: item.epsActual,
      epsEstimated: item.epsEstimated,
      revenueActual: item.revenueActual,
      revenueEstimated: item.revenueEstimated,
      verdict,
      nextDayDelta: null,
      nextDayDeltaLabel: "Next-day \u0394 — provider limited",
    };
  });

  const measuredRows = rows.filter((row) => row.verdict !== "PROVIDER LIMITED");
  const beatCount = measuredRows.filter((row) => row.verdict === "BEAT").length;
  const hasRevenue = rows.some(
    (row) =>
      typeof row.revenueActual === "number" &&
      typeof row.revenueEstimated === "number"
  );
  const dataStatus: DataStatus =
    rows.length && hasRevenue
      ? "live"
      : rows.length
        ? "data-limited"
        : "unavailable";

  return {
    symbol,
    dataStatus,
    summary: rows.length
      ? `${symbol} has beaten EPS estimates in ${beatCount} of the last ${measuredRows.length} quarters.`
      : `${symbol} earnings history is unavailable from the current provider.`,
    rows,
  };
}

function getVerdict(actual: number | null, estimated: number | null): Verdict {
  if (typeof actual !== "number" || typeof estimated !== "number") {
    return "PROVIDER LIMITED";
  }

  const difference = actual - estimated;

  if (Math.abs(difference) <= 0.005) {
    return "IN-LINE";
  }

  return difference > 0 ? "BEAT" : "MISSED";
}

function getQuarterLabel(date: string | null) {
  if (!date) {
    return "Provider limited";
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return "Provider limited";
  }

  const quarter = Math.floor(parsed.getUTCMonth() / 3) + 1;

  return `Q${quarter} ${parsed.getUTCFullYear()}`;
}

function isPastOrToday(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() <= Date.now();
}
