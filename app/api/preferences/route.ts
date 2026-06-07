import { NextResponse } from "next/server";
import { recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { updateUserPreferences } from "@/lib/preferences/update-user-preferences";
import {
  isBriefFocus,
  isExperienceLevel,
  isUserChartRange,
  normalizePreferenceTicker,
  type UserPreferencesUpdate,
} from "@/lib/preferences/types";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { requireApiUser } from "@/lib/security/auth";
import { parseJsonObject } from "@/lib/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedFields = new Set([
  "defaultTicker",
  "defaultChartRange",
  "experienceLevel",
  "briefFocus",
  "preferredSectors",
  "showEducationTips",
]);
const ROUTE = "/api/preferences";

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
    getRateLimitKey(request, auth.userId, "preferences"),
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

  const preferences = await getUserPreferences(auth.supabase, auth.userId);

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
    status: "success",
  });

  return NextResponse.json({ preferences });
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({
      category: "auth_required_failed",
      route: ROUTE,
      method: "PATCH",
    });
    return auth.response;
  }

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "PATCH",
  });
  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "preferences-update"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "PATCH",
    });
    return rateLimitedResponse(limit.resetAt);
  }

  const body = await parseJsonObject(request);

  if (!body.ok) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "PATCH",
      reason: "invalid_json_body",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: body.error,
    });
  }

  const validation = validatePreferencesUpdate(body.value);

  if (!validation.ok) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "PATCH",
      reason: "invalid_preferences_update",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: validation.error,
    });
  }

  try {
    const preferences = await updateUserPreferences(
      auth.supabase,
      auth.userId,
      validation.update
    );

    recordRouteEvent({
      category: "route_request",
      route: ROUTE,
      method: "PATCH",
      status: "success",
    });

    return NextResponse.json({ preferences });
  } catch {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "PATCH",
      reason: "preferences_update_failed",
    });

    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message:
        "Preferences unavailable. Try again after the database migration is applied.",
      status: 500,
    });
  }
}

function validatePreferencesUpdate(body: unknown):
  | { ok: true; update: UserPreferencesUpdate }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const record = body as Record<string, unknown>;
  const unknownFields = Object.keys(record).filter((key) => !allowedFields.has(key));

  if (unknownFields.length) {
    return { ok: false, error: "Unsupported preference field." };
  }

  const update: UserPreferencesUpdate = {};

  if ("defaultTicker" in record) {
    if (typeof record.defaultTicker !== "string") {
      return { ok: false, error: "Default ticker must be text." };
    }

    update.defaultTicker = normalizePreferenceTicker(record.defaultTicker);
  }

  if ("defaultChartRange" in record) {
    if (!isUserChartRange(record.defaultChartRange)) {
      return { ok: false, error: "Chart range must be 1D, 5D, 1M, 6M, or 1Y." };
    }

    update.defaultChartRange = record.defaultChartRange;
  }

  if ("experienceLevel" in record) {
    if (!isExperienceLevel(record.experienceLevel)) {
      return {
        ok: false,
        error: "Experience level must be beginner, intermediate, or advanced.",
      };
    }

    update.experienceLevel = record.experienceLevel;
  }

  if ("briefFocus" in record) {
    if (!isBriefFocus(record.briefFocus)) {
      return {
        ok: false,
        error: "Daily brief focus must be balanced, watchlist, market_context, or education.",
      };
    }

    update.briefFocus = record.briefFocus;
  }

  if ("preferredSectors" in record) {
    if (
      !Array.isArray(record.preferredSectors) ||
      record.preferredSectors.some((sector) => typeof sector !== "string")
    ) {
      return { ok: false, error: "Preferred sectors must be a text list." };
    }

    update.preferredSectors = record.preferredSectors
      .map((sector) => sector.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if ("showEducationTips" in record) {
    if (typeof record.showEducationTips !== "boolean") {
      return { ok: false, error: "Education tips must be true or false." };
    }

    update.showEducationTips = record.showEducationTips;
  }

  return { ok: true, update };
}
