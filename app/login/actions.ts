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

function logAuthError(message: string, error?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[ALQIS auth] ${message}`, error ?? "");
  }
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
    logAuthError("Login failed", error);

    redirect(withStatus("/login", "error", error.message));
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
