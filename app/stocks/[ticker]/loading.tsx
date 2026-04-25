import { BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageContainer, PageShell } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function StockLoading() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <PageContainer>
        <PageShell>
          <section className="rounded-[var(--radius-2xl)] border border-border/60 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_84%,var(--surface-alt)_16%)_0%,color-mix(in_srgb,var(--background)_90%,var(--surface)_10%)_100%)] p-4 shadow-elevation-2 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div className="space-y-3">
                <Badge variant="ai" size="md">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  Loading market intelligence
                </Badge>
                <Skeleton className="h-12 w-72 rounded-[var(--radius-md)]" />
                <Skeleton className="h-5 w-[28rem] max-w-full rounded-[var(--radius-sm)]" />
              </div>
              <Skeleton className="hidden h-36 w-80 rounded-[var(--radius-xl)] lg:block" />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
              <Card variant="elevated" padding="lg" radius="xl" className="border-accent-ai/14">
                <CardHeader>
                  <Skeleton className="h-7 w-44 rounded-[var(--radius-sm)]" />
                  <Skeleton className="h-20 w-full rounded-[var(--radius-lg)]" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-[var(--radius-lg)]" />
                  <Skeleton className="h-16 w-full rounded-[var(--radius-lg)]" />
                  <Skeleton className="h-16 w-full rounded-[var(--radius-lg)]" />
                </CardContent>
              </Card>

              <Card variant="subtle" padding="lg" radius="xl">
                <CardHeader>
                  <Skeleton className="h-7 w-36 rounded-[var(--radius-sm)]" />
                  <Skeleton className="h-5 w-80 max-w-full rounded-[var(--radius-sm)]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[24rem] w-full rounded-[var(--radius-xl)]" />
                </CardContent>
              </Card>
            </div>
          </section>
        </PageShell>
      </PageContainer>
    </main>
  );
}
