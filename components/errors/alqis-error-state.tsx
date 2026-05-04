import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/layout";

export function AlqisErrorState({
  title = "Something went wrong.",
  description = "ALQIS could not complete this request. Please retry or return to the dashboard.",
  retry,
  showLogo = true,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
  showLogo?: boolean;
}) {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <PageContainer className="flex min-h-dvh items-center py-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl">
          {showLogo ? (
            <div className="mb-5">
              <div className="inline-flex items-center gap-3" aria-label="ALQIS">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-accent-ai/16 bg-[color-mix(in_srgb,var(--accent-ai)_14%,transparent)] text-sm font-semibold tracking-[0.2em] text-accent-ai">
                  A
                </span>
                <span className="font-serif text-[1.05rem] font-semibold leading-none tracking-[-0.04em] text-ink">
                  ALQIS
                </span>
              </div>
            </div>
          ) : null}
          <EmptyState
            variant="panel"
            icon={<AlertTriangle className="h-5 w-5" />}
            title={title}
            description={description}
            action={
              <div className="grid gap-3 sm:flex sm:flex-wrap">
                {retry ? (
                  <Button type="button" variant="primary" size="md" onClick={retry}>
                    Retry
                  </Button>
                ) : null}
                <Button asChild variant={retry ? "secondary" : "primary"} size="md">
                  <Link href="/dashboard">Back to dashboard</Link>
                </Button>
              </div>
            }
            meta="ALQIS explanations are informational only and do not constitute investment advice."
            className="border-warn/18 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_88%,var(--warning)_7%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-ai)_4%)_100%)]"
          />
        </div>
      </PageContainer>
    </main>
  );
}
