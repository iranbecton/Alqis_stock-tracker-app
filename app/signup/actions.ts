"use server";

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
        "Account created. Check your email to confirm."
      )
    );
  }

  redirect("/dashboard");
}
