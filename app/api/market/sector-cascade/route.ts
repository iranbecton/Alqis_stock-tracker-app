import { NextResponse } from "next/server";
import { fetchSectorPerformance } from "@/lib/market/sectors";
import { rateLimitedResponse } from "@/lib/errors/api-error";
import { generateSectorRead } from "@/lib/market/sector-explanation";
import { mapTickersToTriggeredSectors } from "@/lib/market/sector-map";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/market/sector-cascade";

type AuthenticatedApiUser = Extract<
  Awaited<ReturnType<typeof requireApiUser>>,
  { ok: true }
>;
type UserTickerRow = {
  ticker?: string | null;
};

export async function GET(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "sector-cascade"),
    RATE_LIMITS.marketData
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  try {
    const sectorFeed = await fetchSectorPerformance();

    if (!sectorFeed.triggeredSectors.length) {
      return noTriggeredResponse();
    }

    const tickers = await getUserExposureTickers(auth);

    if (!tickers.length) {
      return noTriggeredResponse();
    }

    const mappings = await mapTickersToTriggeredSectors(
      tickers,
      sectorFeed.triggeredSectors
    );
    const cascades = mappings.map((mapping) => ({
      sectorRead: generateSectorRead(mapping.sector),
      exposedTickers: mapping.tickers,
    }));

    if (!cascades.length) {
      return noTriggeredResponse();
    }

    return NextResponse.json({
      triggered: true,
      cascades,
    });
  } catch {
    console.error("[ALQIS sector cascade] Route unavailable", {
      route: ROUTE,
      reason: "unexpected_failure",
    });

    return noTriggeredResponse();
  }
}

function noTriggeredResponse() {
  return NextResponse.json({
    triggered: false,
    sectors: [],
  });
}

async function getUserExposureTickers(auth: AuthenticatedApiUser) {
  const [watchlistTickers, portfolioTickers] = await Promise.all([
    getWatchlistTickers(auth),
    getPortfolioTickers(auth),
  ]);

  return Array.from(
    new Set(
      [...watchlistTickers, ...portfolioTickers]
        .map((ticker) => normalizeTicker(ticker))
        .filter((ticker) => isValidTicker(ticker))
    )
  );
}

async function getWatchlistTickers(auth: AuthenticatedApiUser) {
  const { data, error } = await auth.supabase
    .from("watchlist_items")
    .select("ticker")
    .eq("user_id", auth.userId);

  if (error) {
    logUserTickerLoadIssue("watchlist");
    return [];
  }

  return rowsToTickers(data);
}

async function getPortfolioTickers(auth: AuthenticatedApiUser) {
  const { data, error } = await auth.supabase
    .from("portfolio_holdings")
    .select("ticker")
    .eq("user_id", auth.userId);

  if (error) {
    logUserTickerLoadIssue("portfolio");
    return [];
  }

  return rowsToTickers(data);
}

function rowsToTickers(rows: unknown[] | null) {
  return (rows ?? [])
    .map((row) => (row as UserTickerRow).ticker)
    .filter((ticker): ticker is string => typeof ticker === "string");
}

function logUserTickerLoadIssue(source: "watchlist" | "portfolio") {
  console.error("[ALQIS sector cascade] User ticker load unavailable", {
    route: ROUTE,
    source,
    reason: "query_failed",
  });
}
