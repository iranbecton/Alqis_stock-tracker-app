import { type NextRequest, NextResponse } from "next/server";
import { hasCompletedOnboarding } from "@/lib/profile/investor-profile";
import { applySecurityHeaders } from "@/lib/security/headers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectWithHeaders(url: URL) {
  const response = NextResponse.redirect(url);
  applySecurityHeaders(response);
  return response;
}

function safeRelativeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  if (value === "/login" || value === "/signup" || value.startsWith("/onboarding")) {
    return "/dashboard";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const loginUrl = new URL("/login", requestUrl.origin);

  if (!hasSupabaseEnv()) {
    loginUrl.searchParams.set(
      "error",
      "Supabase environment variables are required before signing in."
    );
    return redirectWithHeaders(loginUrl);
  }

  if (!code) {
    loginUrl.searchParams.set("error", "Confirmation link could not be verified.");
    return redirectWithHeaders(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ALQIS auth] Confirmation callback failed", {
        code: error.code,
        message: error.message,
      });
    }

    loginUrl.searchParams.set("error", "Confirmation link could not be verified.");
    return redirectWithHeaders(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    loginUrl.searchParams.set("error", "Sign in could not be completed.");
    return redirectWithHeaders(loginUrl);
  }

  const onboardingUrl = new URL("/onboarding", requestUrl.origin);
  const completedOnboarding = await hasCompletedOnboarding(supabase, user.id);

  if (!completedOnboarding) {
    return redirectWithHeaders(onboardingUrl);
  }

  const nextPath = safeRelativeNext(requestUrl.searchParams.get("next"));
  return redirectWithHeaders(new URL(nextPath, requestUrl.origin));
}
