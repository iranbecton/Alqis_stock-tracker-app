import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Home,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { LandingChartVisual, LandingShell, LandingTopBar } from "@/components/auth/landing-visuals";
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
    <LandingShell>
      <LandingTopBar />
      <div className="mx-auto grid min-h-[calc(100dvh-4.5rem)] w-full max-w-[92rem] gap-4 px-4 pb-6 pt-1 sm:gap-6 sm:px-8 sm:pb-8 sm:pt-3 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center lg:gap-12 lg:px-10">
        <section className="relative flex min-h-0 flex-col justify-center overflow-hidden rounded-[1.35rem] border border-blue-300/10 bg-[#07101d]/28 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_30px_90px_rgba(2,6,14,0.24)] sm:min-h-[25rem] sm:rounded-[2rem] sm:p-6 md:min-h-[28rem] lg:min-h-[42rem] lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_24%,rgba(67,137,255,0.12),transparent_28%),radial-gradient(circle_at_86%_78%,rgba(85,214,170,0.08),transparent_26%)]" />
          <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-300/14 bg-blue-500/8 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-blue-200 sm:px-4 sm:py-2 sm:text-[0.68rem] sm:tracking-[0.18em]">
              <Sparkles className="h-3.5 w-3.5" />
              {isLogin ? "Intelligence access" : "Create your ALQIS profile"}
            </div>
            <div className="space-y-2 sm:space-y-4">
              <h1 className="font-serif text-[clamp(2.35rem,11vw,3.35rem)] leading-[0.9] tracking-[-0.065em] text-[#eef5ff] sm:text-[clamp(3rem,8vw,6.3rem)] sm:leading-[0.88]">
                Understand market moves before the noise takes over.
              </h1>
              <p className="max-w-2xl text-[0.88rem] leading-6 text-blue-100/62 sm:text-lg sm:leading-8">
                Sign in to continue your watchlist, saved reads, and explanation-first market workspace.
              </p>
            </div>
          </div>
          <LandingChartVisual
            compact
            className="relative z-0 mt-0 h-[8.5rem] max-w-4xl opacity-82 sm:mt-2 sm:h-[12rem] md:h-[14rem] lg:mt-3 lg:h-[16rem] lg:opacity-90"
            previewCopy={
              isLogin
                ? "Datacenter demand and guidance strength appear to be contributing to the move."
                : undefined
            }
          />
          <p className="relative z-10 mt-1 max-w-lg text-[11px] leading-4 text-blue-100/42 sm:mt-3 sm:text-[12px] sm:leading-5">
            ALQIS explanations are informational only and do not constitute investment advice.
          </p>
        </section>

        <section
          aria-labelledby="auth-title"
          className="w-full rounded-[1.35rem] border border-blue-200/12 bg-[linear-gradient(180deg,rgba(13,27,48,0.86),rgba(7,14,25,0.94))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_30px_90px_rgba(2,6,14,0.4),0_0_42px_rgba(62,139,255,0.08)] backdrop-blur-xl sm:rounded-[1.75rem] sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-4 sm:mb-6">
            <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
            <Button
              asChild
              variant="quiet"
              size="sm"
              className="rounded-xl text-blue-100/54 hover:text-blue-50"
            >
              <Link href="/">
                <Home className="h-3.5 w-3.5" />
                Home
              </Link>
            </Button>
          </div>

          <div className="mb-4 space-y-1.5 sm:mb-6 sm:space-y-2">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-blue-200/68">
              {isLogin ? "Sign in" : "Start free"}
            </p>
            <h2 id="auth-title" className="font-serif text-[1.55rem] leading-tight tracking-tight text-blue-50 sm:text-3xl">
              {isLogin ? "Welcome back to ALQIS." : "Create your ALQIS profile."}
            </h2>
            <p className="text-body-sm text-blue-100/58 sm:text-body">
              {isLogin
                ? "Understand market moves before the noise takes over."
                : "Start with email and password. Then tune ALQIS to your knowledge level, interests, and preferred explanation depth."}
            </p>
          </div>

          <form action={action} className="space-y-3.5 sm:space-y-4">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                size="lg"
                variant="search"
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
                variant="search"
                leadingIcon={<ShieldCheck className="h-4 w-4" />}
                placeholder="Password"
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className={cn(
                "w-full rounded-xl shadow-[0_0_32px_rgba(77,141,255,0.26)]",
                isLogin
                  ? "bg-[#72c7be] text-[#070F14] hover:bg-[#5ab5ac]"
                  : "bg-[#4d8dff] text-white hover:bg-[#6aa1ff]"
              )}
            >
              {isLogin ? "Sign in" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <AuthStatusMessage error={error} success={success} />
          </form>

          <div className="mt-4 border-t border-blue-200/10 pt-4 text-center text-body-sm text-blue-100/52 sm:mt-5 sm:pt-5">
            {isLogin ? (
              <>
                New to ALQIS?{" "}
                <Link href="/signup" className="font-medium text-blue-200 hover:text-blue-50">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have access?{" "}
                <Link href="/login" className="font-medium text-blue-200 hover:text-blue-50">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </LandingShell>
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
      <span className="text-body-sm font-medium text-blue-100/60">{label}</span>
      {children}
    </label>
  );
}
