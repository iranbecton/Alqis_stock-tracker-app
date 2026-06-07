import { NextResponse } from "next/server";
import { recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import {
  getInvestorProfile,
  saveInvestorProfile,
  updateInvestorProfile,
} from "@/lib/profile/investor-profile";
import {
  isExplanationDepth,
  isInvestmentKnowledgeLevel,
  isMarketExperience,
  isMarketInterest,
  validateInvestorProfileInput,
  type InvestorProfile,
  type MarketInterest,
} from "@/lib/profile/investor-profile-schema";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { parseJsonObject } from "@/lib/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/profile/investor";

export async function GET(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "GET" });
    return auth.response;
  }

  recordRouteEvent({ category: "route_request", route: ROUTE, method: "GET" });
  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "investor-profile"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    recordRouteEvent({ category: "rate_limit_blocked", route: ROUTE, method: "GET" });
    return rateLimitedResponse(limit.resetAt);
  }

  const profile = await getInvestorProfile(auth.supabase, auth.userId);

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
    status: "success",
  });

  return NextResponse.json({
    profile,
    onboardingCompleted: Boolean(
      profile?.onboardingCompleted &&
        profile.disclaimerAcknowledged &&
        profile.disclaimerAcknowledgedAt
    ),
  });
}

export async function PUT(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "PUT" });
    return auth.response;
  }

  recordRouteEvent({ category: "route_request", route: ROUTE, method: "PUT" });
  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "investor-profile-save"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    recordRouteEvent({ category: "rate_limit_blocked", route: ROUTE, method: "PUT" });
    return rateLimitedResponse(limit.resetAt);
  }

  const body = await parseJsonObject(request);

  if (!body.ok) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "PUT",
      reason: "invalid_json_body",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: body.error,
    });
  }

  const validation = validateInvestorProfileInput(body.value);

  if (!validation.ok) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "PUT",
      reason: "invalid_profile_payload",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: validation.error,
    });
  }

  try {
    const profile = await saveInvestorProfile(
      auth.supabase,
      auth.userId,
      validation.value
    );

    recordRouteEvent({
      category: "route_request",
      route: ROUTE,
      method: "PUT",
      status: "success",
    });

    return NextResponse.json({
      profile,
      onboardingCompleted: profile.onboardingCompleted,
    });
  } catch {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "PUT",
      reason: "profile_save_failed",
    });
    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message:
        "Profile unavailable. Try again after the database migration is applied.",
      status: 500,
    });
  }
}

export const POST = PUT;

export async function PATCH(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "PATCH" });
    return auth.response;
  }

  recordRouteEvent({ category: "route_request", route: ROUTE, method: "PATCH" });
  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "investor-profile-update"),
    RATE_LIMITS.userMutation
  );

  if (!limit.allowed) {
    recordRouteEvent({ category: "rate_limit_blocked", route: ROUTE, method: "PATCH" });
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

  const validation = validateInvestorProfileUpdate(body.value);

  if (!validation.ok) {
    recordRouteEvent({
      category: "validation_failed",
      route: ROUTE,
      method: "PATCH",
      reason: "invalid_profile_update_payload",
    });
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: validation.error,
    });
  }

  try {
    const profile = await updateInvestorProfile(
      auth.supabase,
      auth.userId,
      validation.value
    );

    recordRouteEvent({
      category: "route_request",
      route: ROUTE,
      method: "PATCH",
      status: "success",
    });

    return NextResponse.json({ profile });
  } catch {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "PATCH",
      reason: "profile_update_failed",
    });
    return normalizedApiError({
      code: "DATABASE_UNAVAILABLE",
      message:
        "Profile unavailable. Try again after the database migration is applied.",
      status: 500,
    });
  }
}

function validateInvestorProfileUpdate(body: unknown):
  | {
      ok: true;
      value: Pick<
        InvestorProfile,
        | "investmentKnowledgeLevel"
        | "marketExperience"
        | "explanationDepth"
        | "marketInterests"
      >;
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const record = body as Record<string, unknown>;
  const allowedFields = new Set([
    "investmentKnowledgeLevel",
    "marketExperience",
    "explanationDepth",
    "marketInterests",
  ]);
  const unknownFields = Object.keys(record).filter((key) => !allowedFields.has(key));

  if (unknownFields.length) {
    return { ok: false, error: "Unsupported profile field." };
  }

  if (!isInvestmentKnowledgeLevel(record.investmentKnowledgeLevel)) {
    return { ok: false, error: "Choose a valid investing terms familiarity level." };
  }

  if (!isMarketExperience(record.marketExperience)) {
    return { ok: false, error: "Choose a valid market experience range." };
  }

  if (!isExplanationDepth(record.explanationDepth)) {
    return { ok: false, error: "Choose a valid explanation depth." };
  }

  if (!Array.isArray(record.marketInterests)) {
    return { ok: false, error: "Choose at least one market interest." };
  }

  const marketInterests = Array.from(
    new Set(record.marketInterests.filter(isMarketInterest))
  ).slice(0, 9) as MarketInterest[];

  if (!marketInterests.length) {
    return { ok: false, error: "Choose at least one market interest." };
  }

  return {
    ok: true,
    value: {
      investmentKnowledgeLevel: record.investmentKnowledgeLevel,
      marketExperience: record.marketExperience,
      explanationDepth: record.explanationDepth,
      marketInterests,
    },
  };
}
