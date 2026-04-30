import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { chartCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import { twelveDataChartProvider } from "@/lib/market-data/twelve-data";
import {
  isValidTicker,
  normalizeTicker,
  parseChartRange,
} from "@/lib/market-data/validation";

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const symbol = normalizeTicker(ticker);
  const { searchParams } = new URL(request.url);
  const range = parseChartRange(searchParams.get("range"));
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!isValidTicker(symbol)) {
    return NextResponse.json(
      { error: "Invalid ticker symbol." },
      { status: 400 }
    );
  }

  if (!range) {
    return NextResponse.json(
      { error: "Unsupported chart range. Use 1D, 5D, or 1M." },
      { status: 400 }
    );
  }

  try {
    const { data: result, meta } = await withCache(
      chartCacheKey(symbol, range),
      CACHE_TTL.chart,
      async () => {
        if (process.env.NODE_ENV === "development") {
          console.error("[ALQIS chart route] Provider fetch after cache miss", {
            provider: "twelve-data",
            symbol,
            range,
          });
        }

        return twelveDataChartProvider.getCandles(symbol, range);
      },
      {
        forceRefresh,
        shouldCache: (data) => {
          const result = data as Awaited<
            ReturnType<typeof twelveDataChartProvider.getCandles>
          >;
          return result.status === "ok" || result.status === "empty";
        },
      }
    );

    if (result.status !== "ok" && result.status !== "empty") {
      if (process.env.NODE_ENV === "development") {
        console.error("[ALQIS chart route] Chart provider fallback", {
          provider: result.provider,
          symbol,
          range,
          status: result.status,
          providerStatus: result.providerStatus,
          providerMessage: result.providerMessage,
        });
      }

      return NextResponse.json(
        {
          error: result.providerAccessError
            ? "Chart provider access error."
            : result.providerRateLimited
              ? "Chart provider rate limited."
              : "Chart provider error.",
          provider: result.provider,
          providerAccessError: Boolean(result.providerAccessError),
          providerRateLimited: Boolean(result.providerRateLimited),
          providerStatus: result.providerStatus,
          providerMessage: result.providerMessage,
          fallback: "demo-chart-structure",
          symbol,
          range,
          ...meta,
          points: [],
          status: result.providerAccessError
            ? "provider_access_error"
            : result.providerRateLimited
              ? "rate_limited"
              : "provider_error",
        },
        { status: result.providerRateLimited ? 429 : 502 }
      );
    }

    return NextResponse.json({
      symbol,
      range,
      provider: result.provider,
      points: result.points,
      status: result.status,
      fallback: result.points.length > 0 ? null : "demo-chart-structure",
      providerMessage: result.providerMessage,
      ...meta,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS chart route] Unexpected chart provider failure", {
        provider: "twelve-data",
        symbol,
        range,
        error,
      });
    }

    return NextResponse.json(
      {
        error: "Chart provider unavailable.",
        provider: "twelve-data",
        fallback: "demo-chart-structure",
        symbol,
        range,
        points: [],
        status: "provider_error",
      },
      { status: 502 }
    );
  }
}
