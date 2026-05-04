import Link from "next/link";
import { SearchX } from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/layout";

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <PageContainer className="flex min-h-dvh items-center py-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-5">
            <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
          </div>
          <EmptyState
            variant="panel"
            icon={<SearchX className="h-5 w-5" />}
            title="This ALQIS page could not be found."
            description="The route may have moved, or the ticker may not be supported yet."
            action={
              <Button asChild variant="primary" size="md">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            }
            meta="Educational information only. Not investment, legal, or tax advice."
            className="border-accent-ai/12 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_86%,var(--accent-ai)_8%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_4%)_100%)]"
          />
        </div>
      </PageContainer>
    </main>
  );
}
