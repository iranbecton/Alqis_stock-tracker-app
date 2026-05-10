import { NextResponse } from "next/server";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import {
  type StockExplanationRow,
  toExplanationHistoryItem,
} from "@/lib/explanations/types";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return normalizedApiError({ code: "AUTH_REQUIRED" });
  }

  const rate = await rateLimit(
    getRateLimitKey(request, user.id, "explanation-history"),
    RATE_LIMITS.userMutation
  );

  if (!rate.allowed) {
    return rateLimitedResponse(rate.resetAt);
  }

  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get("ticker");
  const ticker = tickerParam ? normalizeTicker(tickerParam) : null;
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? DEFAULT_LIMIT), 1),
    MAX_LIMIT
  );

  if (ticker && !isValidTicker(ticker)) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Invalid ticker symbol.",
    });
  }

  let query = supabase
    .from("stock_explanations")
    .select(
      "id,ticker,company_name,timeframe,summary,confidence_score,confidence_band,confidence_label,source_count,key_factors,counterevidence,generated_at,created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ticker) {
    query = query.eq("ticker", ticker);
  }

  const { data, error } = await query;

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS explanations] History select failed", { error });
    }

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to load explanation history right now.",
      status: 500,
    });
  }

  return NextResponse.json({
    items: ((data ?? []) as StockExplanationRow[]).map(toExplanationHistoryItem),
  });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return normalizedApiError({ code: "AUTH_REQUIRED" });
  }

  const rate = await rateLimit(
    getRateLimitKey(request, user.id, "explanation-history-delete"),
    RATE_LIMITS.userMutation
  );

  if (!rate.allowed) {
    return rateLimitedResponse(rate.resetAt);
  }

  let id = "";

  try {
    const body = (await request.json()) as { id?: unknown };
    id = typeof body.id === "string" ? body.id : "";
  } catch {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Body must include an id.",
    });
  }

  if (!UUID_PATTERN.test(id)) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Invalid explanation id.",
    });
  }

  const { error } = await supabase
    .from("stock_explanations")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS explanations] History delete failed", { error });
    }

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to delete explanation history item.",
      status: 500,
    });
  }

  return NextResponse.json({
    id,
    removed: true,
  });
}
