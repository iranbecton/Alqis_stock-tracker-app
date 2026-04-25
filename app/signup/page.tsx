import { AuthPanel } from "@/components/auth/auth-panel";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { signUpAction } from "./actions";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    success?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const envError = hasSupabaseEnv()
    ? undefined
    : "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

  return (
    <AuthPanel
      mode="signup"
      action={signUpAction}
      error={params.error ?? params.message ?? envError}
      success={params.success}
    />
  );
}
