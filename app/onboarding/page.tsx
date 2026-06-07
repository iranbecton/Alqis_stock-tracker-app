import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InvestorOnboardingForm } from "@/components/profile/investor-onboarding-form";
import { getInvestorProfile } from "@/lib/profile/investor-profile";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tune Your ALQIS Profile",
  description:
    "Help ALQIS explain market moves at the right level for you.",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (!hasSupabaseEnv()) {
    redirect(
      "/login?error=Supabase%20environment%20variables%20are%20required%20before%20setting%20up%20a%20profile."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const profile = await getInvestorProfile(supabase, user.id);

  if (
    profile?.onboardingCompleted &&
    profile.disclaimerAcknowledged &&
    profile.disclaimerAcknowledgedAt
  ) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#050910] text-ink before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_18%_24%,rgba(40,111,203,0.16),transparent_28%),radial-gradient(circle_at_85%_72%,rgba(115,82,189,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_38%)] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(rgba(120,165,220,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(120,165,220,0.026)_1px,transparent_1px)] after:bg-[size:68px_68px] after:opacity-30">
      <div className="relative z-10">
        <InvestorOnboardingForm initialProfile={profile} />
      </div>
    </main>
  );
}
