import { AuthPanel } from "@/components/auth/auth-panel";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { signInAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
    success?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const envError = hasSupabaseEnv()
    ? undefined
    : "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

  return (
    <AuthPanel
      mode="login"
      action={signInAction}
      error={params.error ?? params.message ?? envError}
      next={params.next}
      success={params.success}
    />
  );
}
