import { NextResponse } from "next/server";
import { recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import type { AlertRow } from "@/lib/alerts/types";
import {
  normalizeAlertRow,
  validateAlertPatchBody,
} from "@/lib/alerts/validation";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { parseJsonObject, validateUuid } from "@/lib/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ROUTE = "/api/alerts/[id]";
const ALERT_COLUMNS =
  "id,user_id,ticker,alert_type,direction,threshold_pct,threshold_price,is_enabled,status,last_triggered_at,after_hours_note,created_at,updated_at";

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "PATCH" });
    return auth.response;
  }

  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "alerts-update"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  const id = await getAlertId(context);

  if (!id.ok) {
    return id.response;
  }

  const body = await parseJsonObject(request);

  if (!body.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: body.error,
    });
  }

  const validation = validateAlertPatchBody(body.value);

  if (!validation.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: validation.error,
    });
  }

  const existing = await getOwnedAlert(auth, id.value);

  if (!existing.ok) {
    return existing.response;
  }

  const update = buildClientAlertUpdate(existing.row, validation.value);

  if (!update.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: update.error,
    });
  }

  const { data, error } = await auth.supabase
    .from("alerts")
    .update(update.value)
    .eq("id", id.value)
    .eq("user_id", auth.userId)
    .select(ALERT_COLUMNS)
    .single();

  if (error) {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "PATCH",
      reason: "alerts_update_failed",
    });

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to update alert.",
      status: 500,
    });
  }

  return NextResponse.json({ alert: normalizeAlertRow(data as AlertRow) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "DELETE" });
    return auth.response;
  }

  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "alerts-delete"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  const id = await getAlertId(context);

  if (!id.ok) {
    return id.response;
  }

  const existing = await getOwnedAlert(auth, id.value);

  if (!existing.ok) {
    return existing.response;
  }

  const { error } = await auth.supabase
    .from("alerts")
    .delete()
    .eq("id", id.value)
    .eq("user_id", auth.userId);

  if (error) {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "DELETE",
      reason: "alerts_delete_failed",
    });

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to delete alert.",
      status: 500,
    });
  }

  return NextResponse.json({ success: true });
}

async function getAlertId(context: RouteContext) {
  const { id: idParam } = await context.params;
  const id = validateUuid(idParam);

  if (!id.ok) {
    return {
      ok: false as const,
      response: normalizedApiError({
        code: "VALIDATION_ERROR",
        message: "Invalid alert id.",
      }),
    };
  }

  return { ok: true as const, value: id.id };
}

async function getOwnedAlert(
  auth: Extract<Awaited<ReturnType<typeof requireApiUser>>, { ok: true }>,
  id: string
) {
  const { data, error } = await auth.supabase
    .from("alerts")
    .select(ALERT_COLUMNS)
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) {
    return {
      ok: false as const,
      response: normalizedApiError({
        code: "DATABASE_UNAVAILABLE",
        message: "Unable to load alert.",
        status: 500,
      }),
    };
  }

  if (!data) {
    return {
      ok: false as const,
      response: normalizedApiError({
        code: "NOT_FOUND",
        message: "Alert was not found.",
      }),
    };
  }

  return { ok: true as const, row: data as AlertRow };
}

function buildClientAlertUpdate(
  row: AlertRow,
  input: { is_enabled?: boolean; status?: string }
):
  | { ok: true; value: { is_enabled?: boolean; status?: string } }
  | { ok: false; error: string } {
  if (input.status === "active") {
    if (row.alert_type !== "price_level" || row.status !== "fired") {
      return { ok: false, error: "Only detected price alerts can be reset." };
    }

    return { ok: true, value: { status: "active", is_enabled: true } };
  }

  if (typeof input.is_enabled === "boolean") {
    return {
      ok: true,
      value: {
        is_enabled: input.is_enabled,
        status: input.is_enabled ? "pending" : "paused",
      },
    };
  }

  return { ok: false, error: "No alert updates were provided." };
}
