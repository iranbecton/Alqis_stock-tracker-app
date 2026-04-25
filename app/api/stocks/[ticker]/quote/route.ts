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
    const message =
      error instanceof Error ? error.message : "Unable to fetch quote data.";

    return NextResponse.json(
      {
        error: message,
        symbol,
      },
      { status: 502 }
    );
  }
}
