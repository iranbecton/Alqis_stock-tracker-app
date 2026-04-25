import { ArrowRight, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceDot } from "@/components/ui/confidence-dot";
import { Delta } from "@/components/ui/delta";
import { Ticker } from "@/components/ui/ticker";
import type { SpotlightSignal } from "@/lib/alqis-demo-data";
import { PriceLineChart } from "./price-line-chart";

export function WhyItMovingCard({
  signal,
  asOf,
}: {
  signal: SpotlightSignal;
  asOf: string;
}) {
  return (
    <Card
      padding="lg"
      className="overflow-hidden rounded-[2rem] border-border/80 bg-surface/95 shadow-[0_32px_90px_rgba(2,6,12,0.48)]"
    >
      <CardHeader className="mb-8 gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="ai" size="md" className="shadow-[0_8px_22px_rgba(12,10,20,0.16)]">
                Core signal
              </Badge>
              <Badge variant="outline" size="md">
                {asOf}
              </Badge>
            </div>

            <div className="space-y-3">
              <Ticker
                symbol={signal.symbol}
                name={signal.name}
                size="lg"
                className="gap-1.5"
              />
              <div className="flex flex-wrap items-end gap-3">
                <span
                  className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
                  data-numeric
                >
                  {signal.price}
                </span>
                <Delta
                  value={signal.changePct}
                  absoluteChange={signal.absoluteChange}
                  format="both"
                  size="lg"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-accent-ai/12 bg-[color-mix(in_srgb,var(--surface-elevated)_80%,var(--accent-ai)_20%)] px-4 py-3">
            <span className="mb-2 block text-[11px] uppercase tracking-label text-ink-subtle">
              Confidence
            </span>
            <ConfidenceDot band={signal.confidence} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.9fr)]">
          <div className="space-y-3">
            <CardTitle className="max-w-3xl text-3xl sm:text-[2.6rem]">
              The move is being driven by quality demand signals, not just momentum.
            </CardTitle>
            <p className="max-w-3xl text-base leading-7 text-ink-muted sm:text-lg">
              {signal.thesis}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-accent-ai/12 bg-[color-mix(in_srgb,var(--surface-elevated)_88%,var(--accent-ai)_12%)] p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-label text-ink-subtle">
              <Clock3 className="h-3.5 w-3.5" />
              What ALQIS sees
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              {signal.confidenceSummary}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <PriceLineChart data={signal.points} markers={signal.markers} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section aria-labelledby="contribution-stack" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3
                id="contribution-stack"
                className="text-sm uppercase tracking-label text-ink-subtle"
              >
                Reason stack
              </h3>
              <span className="text-xs text-ink-subtle">{signal.rangeLabel} context</span>
            </div>

            <div className="space-y-3">
              {signal.contributions.map((contribution) => (
                <div key={contribution.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-ink-muted">{contribution.label}</span>
                    <span className="font-medium text-ink" data-numeric>
                      {contribution.value}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,rgba(139,132,199,0.86)_0%,rgba(142,216,208,0.9)_100%)]"
                      style={{ width: `${contribution.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="catalyst-timeline" className="space-y-4">
            <h3
              id="catalyst-timeline"
              className="text-sm uppercase tracking-label text-ink-subtle"
            >
              Catalyst timeline
            </h3>

            <ol className="space-y-3">
              {signal.catalysts.map((catalyst) => (
                <li
                  key={`${catalyst.time}-${catalyst.title}`}
                  className="rounded-[1.35rem] border border-border/70 bg-surface-elevated/80 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-ink">{catalyst.title}</span>
                    <span className="text-xs uppercase tracking-label text-ink-subtle">
                      {catalyst.time}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {catalyst.detail}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-accent-ai">
                    <span>{catalyst.source}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
