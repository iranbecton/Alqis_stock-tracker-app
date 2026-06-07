import { NextResponse } from "next/server";
import { recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { parseJsonObject, validateWatchlistBody } from "@/lib/security/validation";
import type { WatchlistApiItem, WatchlistApiResponse } from "@/lib/watchlist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ROUTE = "/api/watchlist";

type WatchlistRow = {
  id: string;
  ticker: string;
  company_name: string | null;
  created_at: string;
};

function toApiItem(row: WatchlistRow): WatchlistApiItem {
  return {
    id: row.id,
    ticker: row.ticker,
    companyName: row.company_name,
    createdAt: row.created_at,
  };
}

async function parseWatchlistBody(request: Request) {
  const body = await parseJsonObject(request);

  if (!body.ok) {
    return null;
  }

  const validation = validateWatchlistBody(body.value);

  return validation.ok ? validation.value : null;
}

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

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
  });
  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "watchlist"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "GET",
    });
    return rateLimitedResponse(limit.resetAt);
  }

  const { data, error } = await auth.supabase
    .from("watchlist_items")
    .select("id,ticker,company_name,created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Select failed", { error });
    }

    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "GET",
      reason: "watchlist_select_failed",
    });

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to load watchlist right now.",
      status: 500,
    });
  }

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
    status: "success",
  });

  return NextResponse.json<WatchlistApiResponse>({
    items: ((data ?? []) as WatchlistRow[]).map(toApiItem),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({
      category: "auth_required_failed",
      route: ROUTE,
      method: "POST",
    });
    return auth.response;
  }

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "POST",
  });
  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "watchlist-save"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "POST",
    });
    return rateLimitedResponse(limit.resetAt);
  }

  const parsed = await parseWatchlistBody(request);

  if (!parsed) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "POST",
      reason: "invalid_watchlist_body",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Body must include a valid ticker.",
    });
  }

  const { data, error } = await auth.supabase
    .from("watchlist_items")
    .upsert(
      {
        user_id: auth.userId,
        ticker: parsed.ticker,
        company_name: parsed.companyName,
      },
      {
        onConflict: "user_id,ticker",
      }
    )
    .select("id,ticker,company_name,created_at")
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Upsert failed", { error });
    }

    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "POST",
      ticker: parsed.ticker,
      reason: "watchlist_upsert_failed",
    });

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to save ticker to watchlist.",
      status: 500,
    });
  }

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "POST",
    ticker: parsed.ticker,
    status: "success",
  });

  return NextResponse.json({
    item: toApiItem(data as WatchlistRow),
  });
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({
      category: "auth_required_failed",
      route: ROUTE,
      method: "DELETE",
    });
    return auth.response;
  }

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "DELETE",
  });
  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "watchlist-remove"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "DELETE",
    });
    return rateLimitedResponse(limit.resetAt);
  }

  const parsed = await parseWatchlistBody(request);

  if (!parsed) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "DELETE",
      reason: "invalid_watchlist_body",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Body must include a valid ticker.",
    });
  }

  const { error } = await auth.supabase
    .from("watchlist_items")
    .delete()
    .eq("user_id", auth.userId)
    .eq("ticker", parsed.ticker);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Delete failed", { error });
    }

    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "DELETE",
      ticker: parsed.ticker,
      reason: "watchlist_delete_failed",
    });

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to remove ticker from watchlist.",
      status: 500,
    });
  }

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "DELETE",
    ticker: parsed.ticker,
    status: "success",
  });

  return NextResponse.json({
    ticker: parsed.ticker,
    removed: true,
  });
}
