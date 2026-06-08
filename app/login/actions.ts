"use server";

import { redirect } from "next/navigation";
import { hasCompletedOnboarding } from "@/lib/profile/investor-profile";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function getRedirectPath(value: FormDataEntryValue | null) {
  const path = value?.toString();

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

function withStatus(pathname: string, status: "error" | "success", message: string) {
  const params = new URLSearchParams({ [status]: message });
  return `${pathname}?${params.toString()}`;
}

function logAuthError(message: string, category?: string) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[ALQIS auth] ${message}`, {
      category: category ?? "auth_error",
    });
  }
}

function getAuthErrorCategory(error: unknown) {
  if (!error || typeof error !== "object") {
    return "unknown";
  }

  const record = error as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code.toLowerCase() : "";
  const status = typeof record.status === "number" ? record.status : undefined;

  if (status === 429 || code.includes("rate_limit") || code.includes("too_many")) {
    return "rate_limited";
  }

  if (code.includes("email_not_confirmed") || code.includes("email_not_verified")) {
    return "email_not_confirmed";
  }

  if (
    code.includes("invalid_credentials") ||
    code.includes("invalid_login") ||
    code.includes("user_not_found")
  ) {
    return "invalid_credentials";
  }

  return "unknown";
}

function getSignInErrorMessage(category: string) {
  if (category === "email_not_confirmed") {
    return "Please confirm your email address before signing in.";
  }

  if (category === "rate_limited") {
    return "Too many attempts. Please try again shortly.";
  }

  if (category === "invalid_credentials") {
    return "Invalid email or password.";
  }

  return "Something went wrong. Please try again.";
}

export async function signInAction(formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const next = getRedirectPath(formData.get("next"));

  if (!hasSupabaseEnv()) {
    logAuthError("Login blocked by missing Supabase environment variables");

    redirect(
      withStatus(
        "/login",
        "error",
        "Add Supabase environment variables before signing in."
      )
    );
  }

  if (!email || !password) {
    redirect(withStatus("/login", "error", "Enter your email and password."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const category = getAuthErrorCategory(error);
    logAuthError("Login failed", category);

    redirect(withStatus("/login", "error", getSignInErrorMessage(category)));
  }

  const userId = data.user?.id;

  if (!userId) {
    redirect(withStatus("/login", "error", "Sign in could not be completed."));
  }

  const completedOnboarding = await hasCompletedOnboarding(supabase, userId);

  if (!completedOnboarding) {
    redirect("/onboarding");
  }

  redirect(next);
}
