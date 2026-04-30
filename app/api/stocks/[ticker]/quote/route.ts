import { NextResponse } from "next/server";
import {
  getFinnhubCompanyProfile,
  getFinnhubQuote,
} from "@/lib/market-data/finnhub";
import { quoteCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import { withCache } from "@/lib/cache";
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
    return NextResponse.json(
      { error: "Invalid ticker symbol." },
      { status: 400 }
    );
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
        symbol,
      },
      { status: 502 }
    );
  }
}
