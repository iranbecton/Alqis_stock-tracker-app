"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function withStatus(pathname: string, status: "error" | "success", message: string) {
  const params = new URLSearchParams({ [status]: message });
  return `${pathname}?${params.toString()}`;
}

function logAuthError(message: string, error?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[ALQIS auth] ${message}`, error ?? "");
  }
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
    logAuthError("Signup failed", error);

    redirect(withStatus("/signup", "error", error.message));
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
