import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthPanelProps = {
  mode: "login" | "signup";
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  next?: string;
  success?: string;
};

export function AuthPanel({
  mode,
  action,
  error,
  next,
  success,
}: AuthPanelProps) {
  const isLogin = mode === "login";

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(139,132,199,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(114,199,190,0.08),transparent_24%),linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <div className="mx-auto grid min-h-dvh w-full max-w-[88rem] px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center lg:gap-12 lg:px-10">
        <section className="flex min-h-[42vh] flex-col justify-between py-6 lg:min-h-[34rem]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] border border-accent-ai/16 bg-[color-mix(in_srgb,var(--accent-ai)_14%,transparent)] text-sm font-semibold tracking-[0.2em] text-accent-ai">
              A
            </div>
            <div>
              <p className="section-kicker">ALQIS</p>
              <p className="text-body-sm text-ink-muted">Market intelligence</p>
            </div>
          </div>

          <div className="max-w-3xl space-y-5 py-12 lg:py-0">
            <Badge variant="ai" size="md" className="w-fit">
              <BrainCircuit className="h-3.5 w-3.5" />
              Intelligence access
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-serif text-[3rem] leading-[0.98] tracking-tight text-ink sm:text-[4.6rem]">
                Understand the market before it moves past you.
              </h1>
              <p className="max-w-2xl text-body-lg text-ink-muted">
                AI-powered market explanations, watchlists, and stock movement intelligence.
              </p>
            </div>
          </div>

          <p className="text-[12px] leading-5 text-ink-muted">
            Informational only. Not investment advice.
          </p>
        </section>

        <section
          aria-labelledby="auth-title"
          className="rounded-[var(--radius-2xl)] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_84%,var(--accent-ai)_8%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_6%)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_30px_80px_rgba(2,6,10,0.36)] sm:p-6"
        >
          <div className="mb-6 space-y-2">
            <p className="section-kicker">{isLogin ? "Sign in" : "Create account"}</p>
            <h2 id="auth-title" className="font-serif text-3xl tracking-tight text-ink">
              {isLogin ? "Enter the ALQIS shell." : "Create your ALQIS access."}
            </h2>
            <p className="text-body text-ink-muted">
              {isLogin
                ? "Use the account connected to your market intelligence workspace."
                : "Start with email and password. Your account can expand into watchlists and saved intelligence later."}
            </p>
          </div>

          <form action={action} className="space-y-4">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                size="lg"
                leadingIcon={<Mail className="h-4 w-4" />}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                minLength={6}
                size="lg"
                leadingIcon={<ShieldCheck className="h-4 w-4" />}
                placeholder="Password"
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" className="w-full">
              {isLogin ? "Sign in" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <AuthStatusMessage error={error} success={success} />
          </form>

          <div className="mt-5 border-t border-border/60 pt-5 text-center text-body-sm text-ink-muted">
            {isLogin ? (
              <>
                New to ALQIS?{" "}
                <Link href="/signup" className="font-medium text-accent hover:text-accent-hover">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have access?{" "}
                <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
                  Back to login
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthStatusMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) {
    return null;
  }

  const isError = Boolean(error);

  return (
    <div
      className={cn(
        "flex gap-3 rounded-[var(--radius-lg)] border px-4 py-3 text-body-sm",
        isError
          ? "border-loss/24 bg-loss-bg/42 text-ink-muted"
          : "border-gain/24 bg-gain-bg/42 text-ink-muted"
      )}
      role={isError ? "alert" : "status"}
      aria-live="polite"
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-loss" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gain" />
      )}
      <p>{error ?? success}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-2", className)} htmlFor={htmlFor}>
      <span className="text-body-sm font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
