import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { PortfolioTracker } from "@/components/portfolio/portfolio-tracker";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/layout";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  if (!hasSupabaseEnv()) {
    redirect(
      "/login?error=Supabase%20environment%20variables%20are%20required%20before%20opening%20portfolio."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main
      className="min-h-dvh overflow-x-hidden bg-[#03060b] text-[var(--ink)]"
      style={
        {
          "--ink": "#f4f8ff",
          "--ink-muted": "#a7b7cc",
          "--ink-subtle": "#74869d",
          "--accent": "#75e7dc",
          "--gain": "#39e2a0",
          "--loss": "#ff7580",
          "--info": "#86b7d4",
        } as CSSProperties
      }
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_8%,rgba(35,92,142,0.24),transparent_34rem),radial-gradient(ellipse_at_34%_22%,rgba(45,184,170,0.11),transparent_30rem),linear-gradient(180deg,#03060b,#06101b_48%,#03060b)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(125,166,217,0.009)_1px,transparent_1px),linear-gradient(90deg,rgba(125,166,217,0.008)_1px,transparent_1px)] bg-[size:118px_118px] opacity-[0.065] [mask-image:linear-gradient(180deg,#000,transparent_68%)]" />

      <header className="relative z-20 border-b border-[rgba(86,126,176,0.18)] bg-[rgba(4,8,15,0.92)] backdrop-blur-xl">
        <PageContainer className="max-w-[98rem] py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
              <div>
                <p className="section-kicker text-[#72c7be]">Manual portfolio tracker</p>
                <h1 className="mt-1 font-serif text-2xl text-[#F4EEE2]">Portfolio</h1>
              </div>
            </div>
            <Button
              asChild
              variant="quiet"
              size="sm"
              className="border border-[rgba(86,126,176,0.22)]"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </PageContainer>
      </header>

      <PageContainer className="relative z-10 max-w-[98rem] py-5 sm:py-6">
        <div className="mb-4 rounded-[1rem] border border-[#72c7be]/18 bg-[#72c7be]/8 px-4 py-3 text-sm font-medium text-[#F4EEE2]">
          Portfolio tracking only &mdash; ALQIS cannot place trades or access your brokerage accounts.
        </div>
        <PortfolioTracker />
      </PageContainer>
    </main>
  );
}
