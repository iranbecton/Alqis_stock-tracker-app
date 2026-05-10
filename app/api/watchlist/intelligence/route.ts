import { NextResponse } from "next/server";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import {
  getRateLimitKey,
  isRefreshRequest,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { enrichWatchlistItems } from "@/lib/watchlist/intelligence";
import type { WatchlistApiItem } from "@/lib/watchlist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return normalizedApiError({ code: "AUTH_REQUIRED" });
  }

  const bypassCache = isRefreshRequest(request);
  const limit = await rateLimit(
    getRateLimitKey(
      request,
      user.id,
      bypassCache ? "watchlist-intelligence-refresh" : "watchlist-intelligence"
    ),
    bypassCache ? RATE_LIMITS.marketDataRefresh : RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .select("id,ticker,company_name,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Intelligence route load failed", { error });
    }

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Watchlist data unavailable. Your saved tickers are still preserved.",
      status: 500,
    });
  }

  const savedItems: WatchlistApiItem[] = (data ?? []).map((item) => ({
    id: item.id,
    ticker: item.ticker,
    companyName: item.company_name,
    createdAt: item.created_at,
  }));
  const items = await enrichWatchlistItems(savedItems, { bypassCache });

  return NextResponse.json({
    items,
    refreshedAt: new Date().toISOString(),
  });
}
