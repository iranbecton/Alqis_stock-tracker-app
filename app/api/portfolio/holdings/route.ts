import { NextResponse } from "next/server";
import { recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import {
  buildPortfolioResponse,
  getEnrichedPortfolioHoldings,
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
import { parseJsonObject } from "@/lib/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/portfolio/holdings";

export async function GET(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "GET" });
    return auth.response;
  }

  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "portfolio-holdings"),
    RATE_LIMITS.marketData
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  try {
    const holdings = await getEnrichedPortfolioHoldings(auth.supabase, auth.userId);

    return NextResponse.json(buildPortfolioResponse(holdings));
  } catch {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "GET",
      reason: "portfolio_select_failed",
    });
    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to load portfolio holdings right now.",
      status: 500,
    });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "POST" });
    return auth.response;
  }

  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "portfolio-holding-create"),
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

  const validation = validatePortfolioHoldingBody(body.value);

  if (!validation.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: validation.error,
    });
  }

  const payload = validation.value;
  const ticker = payload.ticker ?? "";
  const shares = payload.shares ?? 0;
  const avgCost = payload.avg_cost ?? 0;
  const { data, error } = await auth.supabase
    .from("portfolio_holdings")
    .insert({
      user_id: auth.userId,
      ticker,
      shares,
      avg_cost: avgCost,
      notes: payload.notes ?? null,
    })
    .select("id,user_id,ticker,shares,avg_cost,notes,created_at,updated_at")
    .single();

  if (error) {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "POST",
      reason: "portfolio_insert_failed",
    });
    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to save portfolio holding.",
      status: 500,
    });
  }

  const [quote, sector] = await Promise.all([
    getPortfolioQuote(ticker, shares),
    getPortfolioSector(ticker),
  ]);
  const holding = normalizePortfolioRow(data as PortfolioHoldingRow, quote, sector);

  return NextResponse.json({ holding }, { status: 201 });
}
