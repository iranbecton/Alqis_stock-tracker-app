import type { User } from "@supabase/supabase-js";
import { normalizedApiError } from "@/lib/errors/api-error";
import { createClient } from "@/lib/supabase/server";

type AuthenticatedApiUser = {
  ok: true;
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  userId: string;
};

type UnauthenticatedApiUser = {
  ok: false;
  response: ReturnType<typeof normalizedApiError>;
};

export async function requireApiUser(): Promise<
  AuthenticatedApiUser | UnauthenticatedApiUser
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: normalizedApiError({ code: "AUTH_REQUIRED" }),
    };
  }

  return {
    ok: true,
    supabase,
    user,
    userId: user.id,
  };
}

export function authGuardAvailable() {
  return typeof requireApiUser === "function";
}
