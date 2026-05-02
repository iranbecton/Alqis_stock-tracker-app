import Link from "next/link";
import { Clock3, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ExplanationHistoryItem } from "@/lib/explanations/types";

type RecentReadsSectionProps = {
  items: ExplanationHistoryItem[];
  title?: string;
  description?: string;
  compact?: boolean;
};

export function RecentReadsSection({
  items,
  title = "Recent ALQIS Reads",
  description = "Saved structured explanations from your latest stock reads.",
  compact = false,
}: RecentReadsSectionProps) {
  return (
    <Card
      variant="subtle"
      radius="xl"
      className="border-accent-ai/12 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-ai)_7%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_3%)_100%)]"
    >
      <CardHeader>
        <CardEyebrow>
          <Clock3 className="h-3.5 w-3.5" />
          Explanation history
        </CardEyebrow>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {items.length ? (
          <div className={compact ? "space-y-3" : "grid gap-3 lg:grid-cols-2"}>
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-[var(--radius-lg)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--surface)_18%)] p-4"
              >
                <div className="flex flex-col gap-3 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="ai" size="sm" className="normal-case tracking-normal">
                        Past ALQIS read
                      </Badge>
                      {item.confidenceLabel ? (
                        <Badge variant="outline" size="sm" className="normal-case tracking-normal">
                          {item.confidenceLabel}
                        </Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink">
                      {item.ticker}
                    </h3>
                    <p className="mt-1 text-body-sm text-ink-muted">
                      {item.companyName ?? "Saved market read"} - {item.timeframe}
                    </p>
                  </div>
                  <time className="shrink-0 text-body-sm text-ink-subtle">
                    {formatHistoryTime(item.generatedAt)}
                  </time>
                </div>

                <p className="mt-4 overflow-hidden break-words text-body-sm leading-6 text-ink [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {item.summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                  <span className="text-body-sm text-ink-subtle">
                    {item.sourceCount ?? 0} sources
                  </span>
                  <Button asChild variant="quiet" size="sm" className="min-h-10">
                    <Link href={`/stocks/${item.ticker}`}>
                      Open stock
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            variant="compact"
            icon={<Clock3 className="h-5 w-5" />}
            title="No saved reads yet."
            description="Open a stock read to build your explanation history."
            className="rounded-[var(--radius-lg)] border border-dashed border-border/70 bg-surface/45 px-5 py-6"
          />
        )}
      </CardContent>
    </Card>
  );
}

function formatHistoryTime(value: string) {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return "Recently generated";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}
