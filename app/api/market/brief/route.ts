import { NextResponse } from "next/server";
import { toZonedTime } from "date-fns-tz";
import { withCache } from "@/lib/cache";
import { marketBriefCacheKey, quoteCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import {
  recordCacheOutcome,
  recordRefreshCooldown,
  recordRouteEvent,
} from "@/lib/diagnostics/observability";
import { rateLimitedResponse } from "@/lib/errors/api-error";
import {
  buildDailyMarketBrief,
  type DailyBriefCatalyst,
  type DailyBriefInputItem,
  type MarketSession,
  type PortfolioBriefHolding,
} from "@/lib/market/brief";
import {
  getFinnhubCompanyProfile,
  getFinnhubQuote,
} from "@/lib/market-data/finnhub";
import type { CompanyProfile, StockQuote } from "@/lib/market-data/types";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  isRefreshRequest,
  rateLimit,
  RATE_LIMITS,
  refreshCooldown,
  REFRESH_COOLDOWNS,
} from "@/lib/security/rate-limit";
import type { createClient } from "@/lib/supabase/server";
import { stockUniverse } from "@/lib/stocks/stock-universe";
import type { WatchlistApiItem } from "@/lib/watchlist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CURATED_BRIEF_TICKERS = ["NVDA", "AAPL", "MSFT", "TSLA", "JPM"];
const ROUTE = "/api/market/brief";
const EASTERN_TIME_ZONE = "America/New_York";

type WatchlistRow = {
  id: string;
  ticker: string;
  company_name: string | null;
  created_at: string;
};

type QuotePayload = StockQuote & {
  companyProfile?: CompanyProfile | null;
};

type PortfolioHoldingRow = {
  ticker: string;
  shares: string | number | null;
  avg_cost: string | number | null;
};

type NewsApiPayload = {
  items?: Array<{
    headline?: string;
    publishedAt?: string;
  }>;
};

export async function GET(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({
      category: "auth_required_failed",
      route: ROUTE,
      method: "GET",
    });
    return auth.response;
  }

  const forceRefresh = isRefreshRequest(request);
  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
    refreshRequested: forceRefresh,
  });
  const limit = await rateLimit(
    getRateLimitKey(
      request,
      auth.userId,
      forceRefresh ? "market-brief-refresh" : "market-brief"
    ),
    forceRefresh ? RATE_LIMITS.explainRefresh : RATE_LIMITS.marketBrief
  );

  if (!limit.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "GET",
      refreshRequested: forceRefresh,
    });
    return rateLimitedResponse(limit.resetAt);
  }

  const refreshWindow = forceRefresh
    ? await refreshCooldown(
        getRateLimitKey(request, auth.userId, "market-brief-refresh-window"),
        REFRESH_COOLDOWNS.marketBrief
      )
    : { allowed: true };
  recordRefreshCooldown({
    route: ROUTE,
    requested: forceRefresh,
    allowed: refreshWindow.allowed,
    method: "GET",
  });
  const effectiveForceRefresh = forceRefresh && refreshWindow.allowed;
  const dateKey = new Date().toISOString().slice(0, 10);
  const preferences = await getUserPreferences(auth.supabase, auth.userId);
  const session = getMarketSession();
  const key = `${marketBriefCacheKey(
    auth.userId,
    dateKey,
    preferences.briefFocus
  )}:${session}`;

  const { data, meta } = await withCache(
    key,
    CACHE_TTL.marketBrief,
    async () => {
      const savedItems = await getSavedWatchlistItems(auth.supabase, auth.userId);
      const portfolioHoldings = await getPortfolioHoldings(
        auth.supabase,
        auth.userId
      );
      const isPersonalized = savedItems.length > 0;
      const sourceItems = isPersonalized ? savedItems : getCuratedBriefItems();
      const briefInputs = await Promise.all(
        sourceItems
          .slice(0, 8)
          .map((item) => getBriefInputItem(item, effectiveForceRefresh))
      );
      const catalysts = await getBriefCatalysts(
        sourceItems.slice(0, 4),
        request.url
      );

      return buildDailyMarketBrief({
        items: briefInputs,
        isPersonalized,
        briefFocus: preferences.briefFocus,
        portfolioHoldings,
        catalysts,
        session,
      });
    },
    { forceRefresh: effectiveForceRefresh }
  );
  recordCacheOutcome(ROUTE, meta, {
    method: "GET",
    refreshRequested: forceRefresh,
    refreshAllowed: effectiveForceRefresh,
    status: data.status,
  });

  return NextResponse.json({
    ...data,
    ...meta,
  });
}

async function getSavedWatchlistItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<WatchlistApiItem[]> {
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("id,ticker,company_name,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS market brief] Watchlist load failed", { error });
    }

    return [];
  }

  return ((data ?? []) as WatchlistRow[]).map((item) => ({
    id: item.id,
    ticker: normalizeTicker(item.ticker),
    companyName: item.company_name,
    createdAt: item.created_at,
  }));
}

async function getPortfolioHoldings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<PortfolioBriefHolding[]> {
  const { data, error } = await supabase
    .from("portfolio_holdings")
    .select("ticker,shares,avg_cost")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ALQIS market brief] Portfolio holdings load failed", {
      reason: error.message,
    });
    return [];
  }

  return ((data ?? []) as PortfolioHoldingRow[])
    .map((item) => ({
      ticker: normalizeTicker(item.ticker),
      shares: Number(item.shares),
      avgCost: Number(item.avg_cost),
    }))
    .filter(
      (item) =>
        isValidTicker(item.ticker) &&
        Number.isFinite(item.shares) &&
        Number.isFinite(item.avgCost)
    );
}

async function getBriefCatalysts(
  items: WatchlistApiItem[],
  requestUrl: string
): Promise<DailyBriefCatalyst[]> {
  const results = await Promise.allSettled(
    items.map(async (item) => {
      const ticker = normalizeTicker(item.ticker);

      if (!isValidTicker(ticker)) {
        return null;
      }

      const url = new URL(`/api/stocks/${ticker}/news`, requestUrl);
      const response = await fetch(url, { cache: "no-store" });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as NewsApiPayload;
      const headline = payload.items?.[0]?.headline?.trim();

      if (!headline) {
        return null;
      }

      return {
        ticker,
        headline,
        publishedAt: payload.items?.[0]?.publishedAt ?? new Date().toISOString(),
      };
    })
  );

  return results
    .map((result) => (result.status === "fulfilled" ? result.value : null))
    .filter((item): item is DailyBriefCatalyst => Boolean(item));
}

function getCuratedBriefItems(): WatchlistApiItem[] {
  return CURATED_BRIEF_TICKERS.map((ticker) => {
    const universeItem = stockUniverse.find((item) => item.ticker === ticker);

    return {
      id: `curated-${ticker}`,
      ticker,
      companyName: universeItem?.companyName ?? ticker,
      createdAt: new Date().toISOString(),
    };
  });
}

async function getBriefInputItem(
  item: WatchlistApiItem,
  forceRefresh: boolean
): Promise<DailyBriefInputItem> {
  const ticker = normalizeTicker(item.ticker);
  const universeItem = stockUniverse.find((stock) => stock.ticker === ticker);

  if (!isValidTicker(ticker)) {
    return {
      ticker,
      companyName: item.companyName ?? ticker,
      sector: universeItem?.sector ?? null,
      dataStatus: "unavailable",
    };
  }

  try {
    const quote = await getCachedQuote(ticker, forceRefresh);

    return {
      ticker,
      companyName:
        quote.companyProfile?.companyName ??
        item.companyName ??
        universeItem?.companyName ??
        ticker,
      sector: quote.companyProfile?.sector ?? universeItem?.sector ?? null,
      quote,
      dataStatus: "ok",
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS market brief] Quote fetch failed", {
        ticker,
        error,
      });
    }

    return {
      ticker,
      companyName: item.companyName ?? universeItem?.companyName ?? ticker,
      sector: universeItem?.sector ?? null,
      dataStatus: "unavailable",
    };
  }
}

async function getCachedQuote(ticker: string, forceRefresh: boolean) {
  const { data } = await withCache(
    quoteCacheKey(ticker),
    CACHE_TTL.quote,
    async (): Promise<QuotePayload> => {
      if (process.env.NODE_ENV === "development") {
        console.error("[ALQIS market brief] Provider fetch after cache miss", {
          provider: "finnhub",
          ticker,
        });
      }

      const [quote, profile] = await Promise.all([
        getFinnhubQuote(ticker),
        getFinnhubCompanyProfile(ticker).catch(() => null),
      ]);

      return {
        ...quote,
        companyProfile: profile,
      };
    },
    { forceRefresh }
  );

  return data;
}

function getMarketSession(now = new Date()): MarketSession {
  const easternNow = toZonedTime(now, EASTERN_TIME_ZONE);
  const day = easternNow.getDay();

  if (day === 0 || day === 6) {
    return "weekend";
  }

  const minutes = easternNow.getHours() * 60 + easternNow.getMinutes();

  if (minutes >= 4 * 60 && minutes < 9 * 60 + 30) {
    return "pre_market";
  }

  if (minutes >= 9 * 60 + 30 && minutes < 12 * 60) {
    return "market_open";
  }

  if (minutes >= 12 * 60 && minutes < 16 * 60) {
    return "midday";
  }

  return "after_close";
}
