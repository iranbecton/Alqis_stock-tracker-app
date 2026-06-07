import { NextResponse } from "next/server";
import { recordRouteEvent } from "@/lib/diagnostics/observability";
import { rateLimitedResponse } from "@/lib/errors/api-error";
import { runDiagnostics } from "@/lib/diagnostics/run-diagnostics";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ROUTE = "/api/diagnostics";

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
    getRateLimitKey(request, auth.userId, "diagnostics"),
    RATE_LIMITS.diagnostics
  );

  if (!limit.allowed) {
    recordRouteEvent({
      category: "rate_limit_blocked",
      route: ROUTE,
      method: "GET",
    });
    return rateLimitedResponse(limit.resetAt);
  }

  const report = await runDiagnostics({
    supabase: auth.supabase,
    userId: auth.userId,
  });

  recordRouteEvent({
    category: "route_request",
    route: ROUTE,
    method: "GET",
    status: report.status,
  });

  return NextResponse.json(report);
}
