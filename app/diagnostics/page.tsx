import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { DiagnosticsPanel } from "@/components/diagnostics/diagnostics-panel";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/layout";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ALQIS Diagnostics",
  description: "Internal ALQIS health checks for providers, cache, and database systems.",
};

export default async function DiagnosticsPage() {
  if (!hasSupabaseEnv()) {
    redirect(
      "/login?error=Supabase%20environment%20variables%20are%20required%20before%20opening%20diagnostics."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/diagnostics");
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <PageContainer className="py-5 sm:py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
          <Button asChild variant="quiet" size="md">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>

        <DiagnosticsPanel />
      </PageContainer>
    </main>
  );
}
