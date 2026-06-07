import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { PreferencesPanel } from "@/components/preferences/preferences-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/ui/layout";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { getInvestorProfile } from "@/lib/profile/investor-profile";
import type { InvestorProfile } from "@/lib/profile/investor-profile-schema";
import { ProfileSettingsForm } from "./profile-settings-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (!hasSupabaseEnv()) {
    redirect(
      "/login?error=Supabase%20environment%20variables%20are%20required%20before%20opening%20profile."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, preferences] = await Promise.all([
    getInvestorProfile(supabase, user.id),
    getUserPreferences(supabase, user.id),
  ]);
  const safeProfile = profile ?? createFallbackProfile(user.id);

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
        <PageContainer className="max-w-[86rem] py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
            <Link
              href="/dashboard"
              className="inline-flex min-h-9 items-center gap-2 rounded-[0.65rem] border border-[rgba(86,126,176,0.22)] px-3 text-sm font-semibold text-[#a7b7cc] transition hover:border-[#75e7dc]/38 hover:text-[#f4f8ff]"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </PageContainer>
      </header>

      <PageContainer className="relative z-10 max-w-[86rem] py-6 sm:py-8 lg:py-10">
        <section className="mb-6">
          <p className="section-kicker text-[#75e7dc]">Profile settings</p>
          <h1 className="mt-3 font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-none text-[#f4f8ff]">
            Your ALQIS Profile
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#a7b7cc]">
            Tune how ALQIS explains the market to you.
          </p>
          <p className="mt-4 max-w-3xl rounded-[1rem] border border-[#75e7dc]/18 bg-[#75e7dc]/8 px-4 py-3 text-body-sm leading-6 text-[#c7d5e6]">
            Profile settings personalize explanation style only. ALQIS
            explanations are informational and do not constitute investment advice.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.78fr)] lg:items-start">
          <ProfileSettingsForm initialProfile={safeProfile} />
          <div className="space-y-5">
            <section>
              <p className="mb-3 section-kicker text-[#75e7dc]">
                How ALQIS presents information
              </p>
              <PreferencesPanel initialPreferences={preferences} />
            </section>
            <AccountInfoCard
              email={user.email}
              createdAt={safeProfile.createdAt}
            />
          </div>
        </div>
      </PageContainer>
    </main>
  );
}

function AccountInfoCard({
  email,
  createdAt,
}: {
  email?: string;
  createdAt: string | null;
}) {
  return (
    <Card variant="subtle" radius="xl">
      <CardHeader>
        <CardEyebrow>
          <Mail className="h-3.5 w-3.5" />
          Account Info
        </CardEyebrow>
        <CardTitle className="text-[1.2rem]">Read-only details</CardTitle>
        <CardDescription>
          To change your email or password, contact support.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <InfoRow label="Email address" value={email ?? "Unavailable"} />
        <InfoRow label="Member since" value={formatDate(createdAt)} />
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-border/60 bg-surface/42 px-4 py-3">
      <span className="text-body-sm text-ink-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

function createFallbackProfile(userId: string): InvestorProfile {
  return {
    userId,
    investmentKnowledgeLevel: "basic",
    marketExperience: "starting",
    explanationDepth: "balanced",
    marketInterests: ["individual_stocks", "earnings"],
    onboardingCompleted: false,
    disclaimerAcknowledged: false,
    disclaimerAcknowledgedAt: null,
    createdAt: null,
    updatedAt: null,
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
