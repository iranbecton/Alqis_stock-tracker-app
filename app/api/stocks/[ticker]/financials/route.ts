import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { financialsCacheKey } from "@/lib/cache/keys";
import { recordCacheOutcome, recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import {
  getFMPAnalystEstimates,
  getFMPIncomeStatement,
  getFMPKeyMetrics,
  getFMPProfile,
} from "@/lib/market-data/fmp";
import type { FMPIncomeStatement, FMPKeyMetrics } from "@/lib/market-data/fmp";
import { getFinnhubQuote } from "@/lib/market-data/finnhub";
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

const ROUTE = "/api/stocks/[ticker]/financials";
const FINANCIALS_TTL_SECONDS = 120 * 60;

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
    getRateLimitKey(request, auth.userId, "stock-financials"),
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
      financialsCacheKey(symbol),
      FINANCIALS_TTL_SECONDS,
      async () => buildFinancialsPayload(symbol)
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
      reason: "fundamentals_provider_unavailable",
    });

    return NextResponse.json({
      symbol,
      dataStatus: "unavailable" satisfies DataStatus,
      annualTrend: [],
      snapshot: [],
      valuation: [],
      keyMetrics: [],
      profile: null,
    });
  }
}

async function buildFinancialsPayload(symbol: string) {
  const [incomeStatements, keyMetrics, analystEstimates, profile, quote] = await Promise.all([
    getFMPIncomeStatement(symbol, "annual", 5),
    getFMPKeyMetrics(symbol),
    getFMPAnalystEstimates(symbol),
    getFMPProfile(symbol),
    getFinnhubQuote(symbol).catch(() => null),
  ]);

  const latestIncome = incomeStatements[0] ?? null;
  const price = quote?.price ?? null;
  const peRatio = getPERatio(keyMetrics, latestIncome, price);
  const forwardPE =
    analystEstimates?.estimatedEpsAvg && price
      ? price / analystEstimates.estimatedEpsAvg
      : null;
  const priceToSales =
    keyMetrics?.marketCap && latestIncome?.revenue
      ? keyMetrics.marketCap / latestIncome.revenue
      : null;
  const availableGroups = [
    incomeStatements.length > 0,
    Boolean(keyMetrics),
    Boolean(analystEstimates),
  ].filter(Boolean).length;
  const dataStatus: DataStatus =
    availableGroups >= 2 ? "live" : availableGroups === 1 ? "data-limited" : "unavailable";

  return {
    symbol,
    dataStatus,
    period: keyMetrics?.fiscalYear ?? latestIncome?.fiscalYear ?? null,
    currency: keyMetrics?.reportedCurrency ?? latestIncome?.reportedCurrency ?? null,
    profile,
    annualTrend: incomeStatements
      .slice()
      .reverse()
      .map((row) => ({
        label: row.fiscalYear ? `FY${String(row.fiscalYear).slice(-2)}` : row.date ?? "Period",
        fiscalYear: row.fiscalYear,
        revenue: row.revenue,
        netIncome: row.netIncome,
      })),
    snapshot: [
      metric("Market cap", keyMetrics?.marketCap, "currency"),
      metric("Enterprise value", keyMetrics?.enterpriseValue, "currency"),
      metric("Cash & equivalents", null, "currency"),
      metric("Total debt", null, "currency"),
      metric("Free cash flow yield", keyMetrics?.freeCashFlowYield, "percent"),
      metric("Earnings yield", keyMetrics?.earningsYield, "percent"),
    ],
    valuation: [
      metric("P/E (TTM)", peRatio, "multiple"),
      metric("Fwd P/E", forwardPE, "multiple"),
      metric("EV/EBITDA", keyMetrics?.evToEBITDA, "multiple"),
      metric("FCF yield", keyMetrics?.freeCashFlowYield, "percent"),
      metric("PEG", null, "multiple"),
      metric("P/Sales", priceToSales, "multiple"),
    ],
    keyMetrics: [
      metric("Market cap", keyMetrics?.marketCap, "currency"),
      metric("Price", price, "currency"),
      metric("P/E", peRatio, "multiple"),
      metric("Fwd P/E", forwardPE, "multiple"),
      metric("EPS", latestIncome?.eps, "currency"),
      metric("EV/Sales", keyMetrics?.evToSales, "multiple"),
      metric("FCF yield", keyMetrics?.freeCashFlowYield, "percent"),
      metric("Latest fiscal year", keyMetrics?.fiscalYear ?? latestIncome?.fiscalYear, "text"),
    ],
  };
}

function getPERatio(
  metrics: FMPKeyMetrics | null,
  income: FMPIncomeStatement | null,
  price: number | null
) {
  if (metrics?.earningsYield && metrics.earningsYield > 0) {
    return 1 / metrics.earningsYield;
  }

  if (price && income?.eps && income.eps > 0) {
    return price / income.eps;
  }

  return null;
}

function metric(
  label: string,
  value: number | string | null | undefined,
  format: "currency" | "multiple" | "percent" | "text"
) {
  return {
    label,
    value: value ?? null,
    format,
    limited: value === null || typeof value === "undefined",
  };
}
