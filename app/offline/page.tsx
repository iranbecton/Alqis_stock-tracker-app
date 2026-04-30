import Link from "next/link";
import { WifiOff } from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/layout";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(139,132,199,0.1),transparent_28%),linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <PageContainer className="flex min-h-dvh items-center py-8">
        <section className="mx-auto w-full max-w-xl rounded-[var(--radius-2xl)] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_84%,var(--accent-ai)_8%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_4%)_100%)] p-5 text-left shadow-elevation-2 sm:p-7">
          <AlqisLogo variant="lockup" tone="dark" size="md" priority />

          <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border border-warn/20 bg-warn-bg/35 text-warn">
            <WifiOff className="h-5 w-5" />
          </div>

          <div className="mt-5 space-y-3">
            <p className="section-kicker text-accent-ai">Connection interrupted</p>
            <h1 className="font-serif text-[2.2rem] leading-tight tracking-tight text-ink sm:text-[2.8rem]">
              You&apos;re offline
            </h1>
            <p className="text-body text-ink-muted">
              Reconnect to refresh market data and ALQIS reads.
            </p>
          </div>

          <div className="mt-7">
            <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
