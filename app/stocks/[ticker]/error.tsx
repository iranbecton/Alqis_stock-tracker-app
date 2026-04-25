"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/layout";

export default function StockError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <PageContainer className="flex min-h-dvh items-center py-10">
        <EmptyState
          variant="panel"
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Market data could not be loaded."
          description="ALQIS hit an unexpected stock-page error. Retry the request, or return to the dashboard and search again."
          action={
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="primary" size="md" onClick={reset}>
                Retry
              </Button>
              <Button asChild variant="secondary" size="md">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          }
          className="mx-auto max-w-2xl border-warn/18 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_88%,var(--warning)_7%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-ai)_4%)_100%)]"
        />
      </PageContainer>
    </main>
  );
}
