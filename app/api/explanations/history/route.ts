import { NextResponse } from "next/server";
import { recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import {
  type StockExplanationRow,
  toExplanationHistoryItem,
} from "@/lib/explanations/types";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import {
  parseJsonObject,
  validatePositiveIntegerLimit,
  validateUuid,
} from "@/lib/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;
const ROUTE = "/api/explanations/history";
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
  const rate = await rateLimit(
    getRateLimitKey(request, auth.userId, "explanation-history"),
    RATE_LIMITS.userMutation
  );

  if (!rate.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "GET",
    });
    return rateLimitedResponse(rate.resetAt);
  }

  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get("ticker");
  const ticker = tickerParam ? normalizeTicker(tickerParam) : null;
  const limit = validatePositiveIntegerLimit(searchParams.get("limit"), {
    defaultValue: DEFAULT_LIMIT,
    max: MAX_LIMIT,
  });

  if (ticker && !isValidTicker(ticker)) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "GET",
      ticker,
      reason: "invalid_ticker",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Invalid ticker symbol.",
    });
  }

  let query = auth.supabase
    .from("stock_explanations")
    .select(
      "id,ticker,company_name,timeframe,summary,confidence_score,confidence_band,confidence_label,source_count,key_factors,counterevidence,generated_at,created_at"
    )
    .eq("user_id", auth.userId)
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

    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "GET",
      reason: "history_select_failed",
    });

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to load explanation history right now.",
      status: 500,
    });
  }

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
    ticker,
    status: "success",
  });

  return NextResponse.json({
    items: ((data ?? []) as StockExplanationRow[]).map(toExplanationHistoryItem),
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
  const rate = await rateLimit(
    getRateLimitKey(request, auth.userId, "explanation-history-delete"),
    RATE_LIMITS.userMutation
  );

  if (!rate.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "DELETE",
    });
    return rateLimitedResponse(rate.resetAt);
  }

  const body = await parseJsonObject(request);

  if (!body.ok) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "DELETE",
      reason: "invalid_json_body",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: body.error,
    });
  }

  const id = validateUuid(body.value.id);

  if (!id.ok) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "DELETE",
      reason: "invalid_explanation_id",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Invalid explanation id.",
    });
  }

  const { error } = await auth.supabase
    .from("stock_explanations")
    .delete()
    .eq("user_id", auth.userId)
    .eq("id", id.id);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS explanations] History delete failed", { error });
    }

    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "DELETE",
      reason: "history_delete_failed",
    });

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to delete explanation history item.",
      status: 500,
    });
  }

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "DELETE",
    status: "success",
  });

  return NextResponse.json({
    id: id.id,
    removed: true,
  });
}
