import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import { AlertsNavLink } from "@/components/alerts/alerts-nav-link";
import { AlertsDashboard } from "@/components/alerts/alerts-dashboard";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/layout";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  if (!hasSupabaseEnv()) {
    redirect(
      "/login?error=Supabase%20environment%20variables%20are%20required%20before%20opening%20alerts."
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
      className="min-h-dvh overflow-x-hidden bg-[#070F14] text-[var(--ink)]"
      style={
        {
          "--ink": "#f4f8ff",
          "--ink-muted": "#a7b7cc",
          "--accent": "#72c7be",
          "--gain": "#63cfa8",
          "--loss": "#c9877a",
        } as CSSProperties
      }
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_48%_8%,rgba(35,92,142,0.20),transparent_34rem),radial-gradient(ellipse_at_34%_22%,rgba(45,184,170,0.10),transparent_30rem),linear-gradient(180deg,#070F14,#06101b_48%,#070F14)]" />

      <header className="relative z-20 border-b border-[rgba(86,126,176,0.18)] bg-[rgba(4,8,15,0.92)] backdrop-blur-xl">
        <PageContainer className="max-w-[98rem] py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
            <div className="flex items-center gap-2">
              <AlertsNavLink
                showIcon
                className="rounded-[0.65rem] border border-[rgba(210,169,107,0.24)] bg-[rgba(210,169,107,0.08)] px-3 py-1.5 text-xs font-semibold text-[#F4EEE2]"
              />
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
          </div>
        </PageContainer>
      </header>

      <PageContainer className="relative z-10 max-w-[98rem] py-5 sm:py-6">
        <AlertsDashboard />
      </PageContainer>
    </main>
  );
}
