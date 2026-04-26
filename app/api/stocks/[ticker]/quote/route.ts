import { NextResponse } from "next/server";
import {
  getFinnhubCompanyProfile,
  getFinnhubQuote,
} from "@/lib/market-data/finnhub";
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
    const [quote, profile] = await Promise.all([
      getFinnhubQuote(symbol),
      getFinnhubCompanyProfile(symbol).catch(() => null),
    ]);

    return NextResponse.json({
      ...quote,
      companyProfile: profile,
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
