import { NextResponse } from "next/server";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { WatchlistApiItem, WatchlistApiResponse } from "@/lib/watchlist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

async function parseWatchlistBody(request: Request) {
  try {
    const body = (await request.json()) as {
      ticker?: unknown;
      companyName?: unknown;
    };
    const ticker = typeof body.ticker === "string" ? normalizeTicker(body.ticker) : "";
    const companyName =
      typeof body.companyName === "string" && body.companyName.trim()
        ? body.companyName.trim()
        : null;

    if (!ticker || !isValidTicker(ticker)) {
      return null;
    }

    return { ticker, companyName };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return normalizedApiError({ code: "AUTH_REQUIRED" });
  }

  const limit = await rateLimit(
    getRateLimitKey(request, user.id, "watchlist"),
    RATE_LIMITS.userMutation
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
      console.error("[ALQIS watchlist] Select failed", { error });
    }

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to load watchlist right now.",
      status: 500,
    });
  }

  return NextResponse.json<WatchlistApiResponse>({
    items: ((data ?? []) as WatchlistRow[]).map(toApiItem),
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return normalizedApiError({ code: "AUTH_REQUIRED" });
  }

  const limit = await rateLimit(
    getRateLimitKey(request, user.id, "watchlist-save"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  const parsed = await parseWatchlistBody(request);

  if (!parsed) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Body must include a valid ticker.",
    });
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .upsert(
      {
        user_id: user.id,
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

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to save ticker to watchlist.",
      status: 500,
    });
  }

  return NextResponse.json({
    item: toApiItem(data as WatchlistRow),
  });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return normalizedApiError({ code: "AUTH_REQUIRED" });
  }

  const limit = await rateLimit(
    getRateLimitKey(request, user.id, "watchlist-remove"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  const parsed = await parseWatchlistBody(request);

  if (!parsed) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Body must include a valid ticker.",
    });
  }

  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("user_id", user.id)
    .eq("ticker", parsed.ticker);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Delete failed", { error });
    }

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to remove ticker from watchlist.",
      status: 500,
    });
  }

  return NextResponse.json({
    ticker: parsed.ticker,
    removed: true,
  });
}
