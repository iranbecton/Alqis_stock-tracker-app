import { NextResponse } from "next/server";
import { recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import {
  getPortfolioSector,
  getPortfolioQuote,
  normalizePortfolioRow,
} from "@/lib/portfolio/server";
import type { PortfolioHoldingRow } from "@/lib/portfolio/types";
import { validatePortfolioHoldingBody } from "@/lib/portfolio/validation";
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

const ROUTE = "/api/portfolio/holdings/[id]";

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "PATCH" });
    return auth.response;
  }

  const rate = await rateLimit(
    getRateLimitKey(request, auth.userId, "portfolio-holding-update"),
    RATE_LIMITS.userMutation
  );

  if (!rate.allowed) {
    return rateLimitedResponse(rate.resetAt);
  }

  const { id: idParam } = await context.params;
  const id = validateUuid(idParam);

  if (!id.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Invalid holding id.",
    });
  }

  const body = await parseJsonObject(request);

  if (!body.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: body.error,
    });
  }

  const validation = validatePortfolioHoldingBody(body.value, { partial: true });

  if (!validation.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: validation.error,
    });
  }

  const { data, error } = await auth.supabase
    .from("portfolio_holdings")
    .update(validation.value)
    .eq("id", id.id)
    .select("id,user_id,ticker,shares,avg_cost,notes,created_at,updated_at")
    .maybeSingle();

  if (error) {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "PATCH",
      reason: "portfolio_update_failed",
    });
    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to update portfolio holding.",
      status: 500,
    });
  }

  if (!data) {
    return normalizedApiError({
      code: "NOT_FOUND",
      message: "Portfolio holding was not found.",
    });
  }

  const row = data as PortfolioHoldingRow;
  const [quote, sector] = await Promise.all([
    getPortfolioQuote(row.ticker, Number(row.shares)),
    getPortfolioSector(row.ticker),
  ]);

  return NextResponse.json({
    holding: normalizePortfolioRow(row, quote, sector),
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "DELETE" });
    return auth.response;
  }

  const rate = await rateLimit(
    getRateLimitKey(request, auth.userId, "portfolio-holding-delete"),
    RATE_LIMITS.userMutation
  );

  if (!rate.allowed) {
    return rateLimitedResponse(rate.resetAt);
  }

  const { id: idParam } = await context.params;
  const id = validateUuid(idParam);

  if (!id.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: "Invalid holding id.",
    });
  }

  const { data: existing, error: selectError } = await auth.supabase
    .from("portfolio_holdings")
    .select("id")
    .eq("id", id.id)
    .maybeSingle();

  if (selectError) {
    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to delete portfolio holding.",
      status: 500,
    });
  }

  if (!existing) {
    return normalizedApiError({
      code: "NOT_FOUND",
      message: "Portfolio holding was not found.",
    });
  }

  const { error } = await auth.supabase
    .from("portfolio_holdings")
    .delete()
    .eq("id", id.id);

  if (error) {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "DELETE",
      reason: "portfolio_delete_failed",
    });
    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to delete portfolio holding.",
      status: 500,
    });
  }

  return NextResponse.json({ success: true });
}
