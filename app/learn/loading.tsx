import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearnLoading() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <PageContainer className="py-5 sm:py-8">
        <section className="mb-8 max-w-4xl space-y-4">
          <Badge variant="ai" size="md">
            <BookOpen className="h-3.5 w-3.5" />
            Explain This
          </Badge>
          <Skeleton className="h-20 w-full max-w-3xl rounded-[var(--radius-lg)]" />
          <Skeleton className="h-5 w-full max-w-2xl rounded-[var(--radius-sm)]" />
        </section>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-64 rounded-[var(--radius-xl)]" />
          ))}
        </div>
      </PageContainer>
    </main>
  );
}
