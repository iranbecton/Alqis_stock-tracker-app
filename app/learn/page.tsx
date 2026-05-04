import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { GlossaryBrowser } from "@/components/education/glossary-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/layout";

export const metadata = {
  title: "Investment Encyclopedia",
  description:
    "Plain-English ALQIS education for common market intelligence terms.",
};

export default function LearnPage() {
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

        <section className="mb-8 max-w-4xl space-y-4">
          <Badge variant="ai" size="md">
            <BookOpen className="h-3.5 w-3.5" />
            Explain This
          </Badge>
          <div className="space-y-3">
            <h1 className="font-serif text-[2.45rem] leading-[0.98] tracking-tight text-ink sm:text-[4.5rem]">
              ALQIS Investment Encyclopedia
            </h1>
            <p className="max-w-3xl text-body text-ink-muted sm:text-body-lg">
              Plain-English definitions for market terms that appear inside ALQIS reads,
              proof cards, watchlists, and data quality labels.
            </p>
          </div>
          <p className="rounded-[var(--radius-lg)] border border-border/70 bg-surface/42 px-4 py-3 text-body-sm text-ink-subtle">
            Educational information only. Not investment, legal, or tax advice.
          </p>
        </section>

        <GlossaryBrowser />
      </PageContainer>
    </main>
  );
}
