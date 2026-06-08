"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

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

  if (code.includes("weak_password") || code.includes("validation")) {
    return "weak_password";
  }

  if (
    code.includes("already") ||
    code.includes("exists") ||
    code.includes("registered")
  ) {
    return "email_already_registered";
  }

  return "unknown";
}

function getSignUpErrorMessage(category: string) {
  if (category === "weak_password") {
    return "Password does not meet requirements.";
  }

  if (category === "rate_limited") {
    return "Too many attempts. Please try again shortly.";
  }

  return "Something went wrong. Please try again.";
}

async function getAuthCallbackUrl() {
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  return new URL("/auth/callback", origin).toString();
}

export async function signUpAction(formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!hasSupabaseEnv()) {
    logAuthError("Signup blocked by missing Supabase environment variables");

    redirect(
      withStatus(
        "/signup",
        "error",
        "Add Supabase environment variables before creating an account."
      )
    );
  }

  if (!email || !password) {
    redirect(withStatus("/signup", "error", "Enter an email and password."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: await getAuthCallbackUrl(),
    },
  });

  if (error) {
    const category = getAuthErrorCategory(error);
    logAuthError("Signup failed", category);

    redirect(withStatus("/signup", "error", getSignUpErrorMessage(category)));
  }

  if (!data.session) {
    redirect(
      withStatus(
        "/signup",
        "success",
        "Check your email to confirm your account. After confirmation, ALQIS will help you tune your profile."
      )
    );
  }

  redirect("/onboarding");
}
