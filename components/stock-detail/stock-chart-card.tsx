"use client";

import { useState } from "react";
import { BarChart3, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChartFrame } from "@/components/ui/chart-frame";
import { ExplainThis } from "@/components/education/explain-this";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stockDetailDemoData, type StockChartRange } from "@/lib/stock-detail-demo-data";
import {
  PriceLineChart,
  type ChartMarkerInsight,
} from "@/components/alqis/price-line-chart";

const ranges: StockChartRange[] = ["1d", "5d", "1m"];

type StockChartCardProps = {
  data?: typeof stockDetailDemoData;
};

export function StockChartCard({ data = stockDetailDemoData }: StockChartCardProps) {
  const [activeRange, setActiveRange] = useState<StockChartRange>("1d");
  const [selectedInsights, setSelectedInsights] = useState<
    Partial<Record<StockChartRange, ChartMarkerInsight | null>>
  >({});
  const providerLabel =
    ranges
      .map((range) =>
        data.chartRanges[range].stats.find((stat) => stat.label === "Source")
          ?.value
      )
      .find(
        (source) =>
          source &&
          source !== "Demo fallback" &&
          source !== "Chart provider unavailable"
      ) ??
    data.chartRanges["1d"].stats.find((stat) => stat.label === "Source")
      ?.value ??
    "15 min delay";

  return (
    <Tabs
      value={activeRange}
      onValueChange={(value) => setActiveRange(value as StockChartRange)}
      className="w-full"
    >
      <ChartFrame
        className="border-accent-secondary/10"
        title={
          <span className="inline-flex items-center gap-2">
            Proof of move
            <ExplainThis termId="proof-of-move" compact />
          </span>
        }
        subtitle="If the explanation is right, price action and breadth should keep validating it."
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="ai" size="sm" className="normal-case tracking-normal">
                <BrainCircuit className="h-3.5 w-3.5" />
                Evidence for the read
              </Badge>
              <Badge variant="live" size="sm">
                {data.company.marketStatus}
              </Badge>
              <Badge variant="outline" size="sm" className="normal-case tracking-normal">
                {providerLabel}
              </Badge>
            </div>
            <TabsList aria-label="Chart ranges" className="w-full sm:w-auto">
              {ranges.map((range) => (
                <TabsTrigger key={range} value={range}>
                  {data.chartRanges[range].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        }
      >
        {ranges.map((range) => {
          const chart = data.chartRanges[range];
          const source = chart.stats.find((stat) => stat.label === "Source")?.value;
          const isFallback = source === "Chart provider unavailable" || source === "Demo fallback";

          return (
            <TabsContent key={range} value={range} className="mt-0 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[0.88rem] leading-5 text-ink-muted">
                  <BarChart3 className="h-4 w-4" />
                  {chart.subtitle}
                </div>
                <div className="flex items-center gap-2 text-[0.86rem] leading-5 text-ink-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-secondary" aria-hidden />
                  {isFallback
                    ? "Fallback structure is shown for layout only; it is not used as chart confirmation."
                    : "Markers show where the tape confirms or challenges the thesis."}
                </div>
              </div>

              <PriceLineChart
                data={chart.points}
                markers={isFallback ? [] : chart.markers}
                markersDisabled={isFallback}
                onSelectedInsightChange={(insight) =>
                  setSelectedInsights((current) => {
                    const previous = current[range] ?? null;
                    const unchanged =
                      previous?.title === insight?.title &&
                      previous?.timestamp === insight?.timestamp &&
                      previous?.price === insight?.price &&
                      previous?.stance === insight?.stance;

                    if (unchanged) {
                      return current;
                    }

                    return {
                      ...current,
                      [range]: insight,
                    };
                  })
                }
              />

              <div className="rounded-[var(--radius-lg)] border border-accent-ai/10 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-ai)_5%)] px-4 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="section-kicker text-accent-ai">
                    Proof-of-move read
                  </p>
                  <Badge
                    variant={isFallback ? "outline" : "ai"}
                    size="sm"
                    className="normal-case tracking-normal"
                  >
                    {isFallback ? "Illustrative only" : "Interactive markers"}
                  </Badge>
                </div>
                {isFallback ? (
                  <p className="mt-2 text-body-sm leading-6 text-ink-muted">
                    Demo chart structure - not live proof. Demo markers are
                    illustrative only and are not used as evidence.
                  </p>
                ) : selectedInsights[range] ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" size="sm" className="normal-case tracking-normal">
                        {selectedInsights[range]?.stance}
                      </Badge>
                      <span className="text-body-sm text-ink-subtle">
                        {selectedInsights[range]?.markerType}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-ink">
                      {selectedInsights[range]?.title}
                    </p>
                    <p className="text-body-sm leading-6 text-ink-muted">
                      {selectedInsights[range]?.explanation}
                    </p>
                    <p className="text-[0.78rem] leading-5 text-ink-subtle">
                      {selectedInsights[range]?.timestamp} -{" "}
                      {selectedInsights[range]?.price} -{" "}
                      {selectedInsights[range]?.changePct}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-body-sm leading-6 text-ink-muted">
                    Markers show where price action confirms, challenges, or
                    contextualizes the current ALQIS read. Select one to inspect
                    the evidence anchor.
                  </p>
                )}
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                {chart.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[var(--radius-lg)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_84%,var(--surface)_16%)] px-4 py-3"
                  >
                    <p className="section-kicker inline-flex items-center gap-1.5 text-ink-muted">
                      {stat.label}
                      {getChartStatTermId(stat.label) ? (
                        <ExplainThis termId={getChartStatTermId(stat.label) ?? ""} compact />
                      ) : null}
                    </p>
                    <p className="mt-2 text-base font-medium text-ink">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[var(--radius-lg)] border border-accent-ai/10 bg-[color-mix(in_srgb,var(--surface-elevated)_80%,var(--accent-ai)_6%)] px-4 py-3.5">
                <div className="flex items-center gap-2 text-body-sm text-ink-subtle">
                  <BrainCircuit className="h-4 w-4 text-accent-ai" />
                  {isFallback ? "Chart provider status" : "How the chart supports the thesis"}
                </div>
                <p className="mt-2 text-body text-ink-muted">{chart.footer}</p>
              </div>
            </TabsContent>
          );
        })}
      </ChartFrame>
    </Tabs>
  );
}

function getChartStatTermId(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("move") || normalized.includes("window")) {
    return "chart-window-move";
  }

  if (normalized.includes("source")) {
    return "proof-of-move";
  }

  return null;
}
