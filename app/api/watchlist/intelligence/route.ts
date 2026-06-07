import { NextResponse } from "next/server";
import {
  recordRefreshCooldown,
  recordRouteEvent,
} from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  isRefreshRequest,
  rateLimit,
  RATE_LIMITS,
  refreshCooldown,
  REFRESH_COOLDOWNS,
} from "@/lib/security/rate-limit";
import { enrichWatchlistItems } from "@/lib/watchlist/intelligence";
import type { WatchlistApiItem } from "@/lib/watchlist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ROUTE = "/api/watchlist/intelligence";

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

  const bypassCache = isRefreshRequest(request);
  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
    refreshRequested: bypassCache,
  });
  const limit = await rateLimit(
    getRateLimitKey(
      request,
      auth.userId,
      bypassCache ? "watchlist-intelligence-refresh" : "watchlist-intelligence"
    ),
    bypassCache ? RATE_LIMITS.marketDataRefresh : RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "GET",
      refreshRequested: bypassCache,
    });
    return rateLimitedResponse(limit.resetAt);
  }

  const refreshWindow = bypassCache
    ? await refreshCooldown(
        getRateLimitKey(
          request,
          auth.userId,
          "watchlist-intelligence-refresh-window"
        ),
        REFRESH_COOLDOWNS.watchlistIntelligence
      )
    : { allowed: true };
  recordRefreshCooldown({
    route: ROUTE,
    requested: bypassCache,
    allowed: refreshWindow.allowed,
    method: "GET",
  });
  const effectiveBypassCache = bypassCache && refreshWindow.allowed;

  const { data, error } = await auth.supabase
    .from("watchlist_items")
    .select("id,ticker,company_name,created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Intelligence route load failed", { error });
    }

    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "GET",
      reason: "watchlist_database_unavailable",
    });

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
  const items = await enrichWatchlistItems(savedItems, {
    bypassCache: effectiveBypassCache,
  });
  const unavailableCount = items.filter(
    (item) => item.providerStatus === "unavailable"
  ).length;

  if (unavailableCount > 0) {
    recordRouteEvent({
      category: "provider_fallback",
      route: ROUTE,
      method: "GET",
      status: `unavailable_items:${unavailableCount}`,
      reason: "watchlist_enrichment_partial",
    });
  }

  return NextResponse.json({
    items,
    refreshedAt: new Date().toISOString(),
  });
}
