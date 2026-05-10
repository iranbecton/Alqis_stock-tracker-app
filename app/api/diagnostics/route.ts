import { NextResponse } from "next/server";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import { runDiagnostics } from "@/lib/diagnostics/run-diagnostics";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return normalizedApiError({ code: "AUTH_REQUIRED" });
  }

  const limit = await rateLimit(
    getRateLimitKey(request, user.id, "diagnostics"),
    RATE_LIMITS.diagnostics
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  const report = await runDiagnostics({
    supabase,
    userId: user.id,
  });

  return NextResponse.json(report);
}
