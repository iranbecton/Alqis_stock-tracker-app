import { NextResponse } from "next/server";
import {
  getFinnhubCompanyProfile,
  getFinnhubQuote,
} from "@/lib/market-data/finnhub";
import { quoteCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import { withCache } from "@/lib/cache";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import {
  getRateLimitKey,
  isRefreshRequest,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const symbol = normalizeTicker(ticker);
  const forceRefresh = isRefreshRequest(request);
  const limit = await rateLimit(
    getRateLimitKey(
      request,
      null,
      forceRefresh ? "quote-refresh" : "quote"
    ),
    forceRefresh ? RATE_LIMITS.marketDataRefresh : RATE_LIMITS.marketData
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  if (!isValidTicker(symbol)) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Invalid ticker symbol.",
    });
  }

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
      { forceRefresh }
    );

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

    return NextResponse.json(
      {
        error: "Quote provider unavailable.",
        code: "provider_unavailable",
        retryable: true,
        symbol,
      },
      { status: 502 }
    );
  }
}
