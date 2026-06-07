import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { recordCacheOutcome, recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
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

type FinnhubEarningsCalendarResponse = {
  earningsCalendar?: Array<{
    date?: string;
    epsEstimate?: number;
    revenueEstimate?: number;
    symbol?: string;
  }>;
};

type EarningsResponse = {
  ticker: string;
  date: string | null;
  epsEstimate: number | null;
  revenueEstimate: number | null;
};

const ROUTE = "/api/stocks/[ticker]/earnings";
const EARNINGS_TTL_SECONDS = 60 * 60;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "GET" });
    return auth.response;
  }

  const { ticker } = await context.params;
  const symbol = normalizeTicker(ticker);

  if (!isValidTicker(symbol)) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Invalid ticker symbol.",
    });
  }

  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "stock-earnings"),
    RATE_LIMITS.marketData
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  const { data, meta } = await withCache(
    `earnings:${symbol}`,
    EARNINGS_TTL_SECONDS,
    () => fetchUpcomingEarnings(symbol)
  );

  recordCacheOutcome(ROUTE, meta, {
    method: "GET",
    ticker: symbol,
    provider: "finnhub",
  });

  return NextResponse.json(data);
}

async function fetchUpcomingEarnings(symbol: string): Promise<EarningsResponse> {
  try {
    const url = new URL("https://finnhub.io/api/v1/calendar/earnings");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("token", getFinnhubApiKey());

    const response = await fetch(url, {
      next: { revalidate: EARNINGS_TTL_SECONDS },
    });

    if (!response.ok) {
      return nullEarnings(symbol);
    }

    const payload = (await response.json()) as FinnhubEarningsCalendarResponse;
    const today = new Date().toISOString().slice(0, 10);
    const next = (payload.earningsCalendar ?? [])
      .filter((item) => typeof item.date === "string" && item.date >= today)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];

    if (!next?.date) {
      return nullEarnings(symbol);
    }

    return {
      ticker: symbol,
      date: next.date,
      epsEstimate:
        typeof next.epsEstimate === "number" ? next.epsEstimate : null,
      revenueEstimate:
        typeof next.revenueEstimate === "number" ? next.revenueEstimate : null,
    };
  } catch {
    return nullEarnings(symbol);
  }
}

function nullEarnings(symbol: string): EarningsResponse {
  return {
    ticker: symbol,
    date: null,
    epsEstimate: null,
    revenueEstimate: null,
  };
}

function getFinnhubApiKey() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FINNHUB_API_KEY.");
  }

  return apiKey;
}
