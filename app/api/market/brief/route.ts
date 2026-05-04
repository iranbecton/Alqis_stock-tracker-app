import { NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { marketBriefCacheKey, quoteCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import {
  buildDailyMarketBrief,
  type DailyBriefInputItem,
} from "@/lib/market/brief";
import {
  getFinnhubCompanyProfile,
  getFinnhubQuote,
} from "@/lib/market-data/finnhub";
import type { CompanyProfile, StockQuote } from "@/lib/market-data/types";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { createClient } from "@/lib/supabase/server";
import { stockUniverse } from "@/lib/stocks/stock-universe";
import type { WatchlistApiItem } from "@/lib/watchlist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CURATED_BRIEF_TICKERS = ["NVDA", "AAPL", "MSFT", "TSLA", "JPM"];

type WatchlistRow = {
  id: string;
  ticker: string;
  company_name: string | null;
  created_at: string;
};

type QuotePayload = StockQuote & {
  companyProfile?: CompanyProfile | null;
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const dateKey = new Date().toISOString().slice(0, 10);
  const preferences = await getUserPreferences(supabase, user.id);
  const key = marketBriefCacheKey(user.id, dateKey, preferences.briefFocus);

  const { data, meta } = await withCache(
    key,
    CACHE_TTL.marketBrief,
    async () => {
      const savedItems = await getSavedWatchlistItems(supabase, user.id);
      const isPersonalized = savedItems.length > 0;
      const sourceItems = isPersonalized ? savedItems : getCuratedBriefItems();
      const briefInputs = await Promise.all(
        sourceItems.slice(0, 8).map((item) => getBriefInputItem(item, forceRefresh))
      );

      return buildDailyMarketBrief({
        items: briefInputs,
        isPersonalized,
        briefFocus: preferences.briefFocus,
      });
    },
    { forceRefresh }
  );

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
