import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { newsCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
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
    return NextResponse.json(
      { error: "Invalid ticker symbol." },
      { status: 400 }
    );
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
    const message =
      error instanceof Error ? error.message : "Unable to fetch news data.";

    return NextResponse.json(
      {
        error: message,
        symbol,
        items: [],
      },
      { status: 502 }
    );
  }
}
