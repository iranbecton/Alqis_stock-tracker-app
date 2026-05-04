import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiagnosticsLoading() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <PageContainer className="py-5 sm:py-8">
        <Card variant="subtle" radius="xl" className="border-accent-ai/14">
          <CardHeader>
            <div className="flex items-center gap-2 text-accent-ai">
              <Activity className="h-4 w-4" />
              <span className="section-kicker">Internal health</span>
            </div>
            <Skeleton className="h-10 w-72 rounded-[var(--radius-md)]" />
            <Skeleton className="h-4 w-full max-w-xl rounded-[var(--radius-sm)]" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <Skeleton key={item} className="h-36 rounded-[var(--radius-lg)]" />
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
