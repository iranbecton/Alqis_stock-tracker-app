import { Bookmark, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/layout";

export default function DashboardLoading() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <PageContainer className="py-8 sm:py-10">
        <section className="space-y-6">
          <div className="max-w-3xl space-y-3">
            <Badge variant="ai" size="md">
              <BrainCircuit className="h-3.5 w-3.5" />
              Protected intelligence shell
            </Badge>
            <div className="h-14 w-72 rounded-full bg-surface-elevated sm:h-16 sm:w-96" />
            <div className="h-5 w-full max-w-2xl rounded-full bg-surface-elevated" />
          </div>

          <Card
            variant="subtle"
            radius="xl"
            className="border-accent-ai/16 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_84%,var(--accent-ai)_9%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_4%)_100%)]"
          >
            <CardHeader>
              <div className="flex items-center gap-2 text-accent-ai">
                <Bookmark className="h-4 w-4" />
                <span className="section-kicker">Your Watchlist</span>
              </div>
              <div className="h-8 w-64 rounded-full bg-surface-elevated" />
              <div className="h-4 w-full max-w-xl rounded-full bg-surface-elevated" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="min-h-48 rounded-[var(--radius-lg)] border border-border/60 bg-surface/40 p-4"
                  >
                    <div className="h-4 w-20 rounded-full bg-surface-elevated" />
                    <div className="mt-4 h-7 w-32 rounded-full bg-surface-elevated" />
                    <div className="mt-5 h-4 w-full rounded-full bg-surface-elevated" />
                    <div className="mt-2 h-4 w-3/4 rounded-full bg-surface-elevated" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </PageContainer>
    </main>
  );
}
