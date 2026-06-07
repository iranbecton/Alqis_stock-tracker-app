import { NextResponse } from "next/server";
import { recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import type { AlertRow } from "@/lib/alerts/types";
import {
  normalizeAlertRow,
  validateCreateAlertBody,
} from "@/lib/alerts/validation";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { parseJsonObject } from "@/lib/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/alerts";
const ALERT_COLUMNS =
  "id,user_id,ticker,alert_type,direction,threshold_pct,threshold_price,is_enabled,status,last_triggered_at,after_hours_note,created_at,updated_at";

export async function GET(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "GET" });
    return auth.response;
  }

  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "alerts-list"),
    RATE_LIMITS.marketData
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  const { data, error } = await auth.supabase
    .from("alerts")
    .select(ALERT_COLUMNS)
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "GET",
      reason: "alerts_select_failed",
    });

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to load alerts right now.",
      status: 500,
    });
  }

  return NextResponse.json({
    alerts: ((data ?? []) as AlertRow[]).map(normalizeAlertRow),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "POST" });
    return auth.response;
  }

  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "alerts-create"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  const body = await parseJsonObject(request);

  if (!body.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: body.error,
    });
  }

  const validation = validateCreateAlertBody(body.value);

  if (!validation.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: validation.error,
    });
  }

  const { data, error } = await auth.supabase
    .from("alerts")
    .insert({
      user_id: auth.userId,
      ticker: validation.value.ticker,
      alert_type: validation.value.alert_type,
      direction: validation.value.direction,
      threshold_pct: validation.value.threshold_pct,
      threshold_price: validation.value.threshold_price,
      status: "pending",
      is_enabled: true,
    })
    .select(ALERT_COLUMNS)
    .single();

  if (error) {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "POST",
      reason: "alerts_insert_failed",
    });

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to save alert.",
      status: 500,
    });
  }

  return NextResponse.json({ alert: normalizeAlertRow(data as AlertRow) }, { status: 201 });
}
