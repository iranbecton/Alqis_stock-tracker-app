import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { newsCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import { logServerError, normalizedApiError } from "@/lib/errors/api-error";
import { getFinnhubCompanyProfile } from "@/lib/market-data/finnhub";
import { filterCompanyNews, getFinnhubCompanyNews } from "@/lib/news/finnhub";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const symbol = normalizeTicker(ticker);
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!isValidTicker(symbol)) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Invalid ticker symbol.",
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
      { forceRefresh }
    );

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

    return NextResponse.json(
      {
        error: "News provider unavailable.",
        code: "PROVIDER_UNAVAILABLE",
        retryable: true,
        symbol,
        items: [],
      },
      { status: 502 }
    );
  }
}
