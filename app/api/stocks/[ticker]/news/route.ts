import { NextResponse } from "next/server";
import { getFinnhubCompanyProfile } from "@/lib/market-data/finnhub";
import { filterCompanyNews, getFinnhubCompanyNews } from "@/lib/news/finnhub";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const symbol = normalizeTicker(ticker);

  if (!isValidTicker(symbol)) {
    return NextResponse.json(
      { error: "Invalid ticker symbol." },
      { status: 400 }
    );
  }

  try {
    const [items, profile] = await Promise.all([
      getFinnhubCompanyNews(symbol),
      getFinnhubCompanyProfile(symbol).catch(() => null),
    ]);
    const filteredItems = filterCompanyNews(items, symbol, profile?.companyName);

    return NextResponse.json({
      symbol,
      items: filteredItems.slice(0, 8),
      status: filteredItems.length > 0 ? "ok" : "empty",
      filteredOut: Math.max(items.length - filteredItems.length, 0),
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
