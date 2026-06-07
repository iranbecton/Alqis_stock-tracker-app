"use client";

import { useState } from "react";
import { BarChart3, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChartFrame } from "@/components/ui/chart-frame";
import { ExplainThis } from "@/components/education/explain-this";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { stockDetailDemoData, type StockChartRange } from "@/lib/stock-detail-demo-data";
import { cn } from "@/lib/utils";
import {
  PriceLineChart,
  type ChartMarkerInsight,
} from "@/components/alqis/price-line-chart";

const ranges: StockChartRange[] = ["1d", "5d", "1m"];
const referenceRanges = [
  { label: "1D", value: "1d", enabled: true },
  { label: "5D", value: "5d", enabled: true },
  { label: "1M", value: "1m", enabled: true },
  { label: "3M", value: "3m", enabled: false },
  { label: "1Y", value: "1y", enabled: false },
  { label: "7Y", value: "7y", enabled: false },
] as const;

type StockChartCardProps = {
  data?: typeof stockDetailDemoData;
  defaultRange?: StockChartRange;
  presentation?: "default" | "overview";
};

export function StockChartCard({
  data = stockDetailDemoData,
  defaultRange = "1d",
  presentation = "default",
}: StockChartCardProps) {
  const [activeRange, setActiveRange] = useState<StockChartRange>(defaultRange);
  const [selectedInsights, setSelectedInsights] = useState<
    Partial<Record<StockChartRange, ChartMarkerInsight | null>>
  >({});
  const providerLabel =
    ranges
      .map((range) =>
        getChartRange(data, range).stats.find((stat) => stat.label === "Source")
          ?.value
      )
      .find(
        (source) =>
          source &&
          source !== "Demo fallback" &&
          source !== "Chart provider unavailable"
      ) ??
    getChartRange(data, "1d").stats.find((stat) => stat.label === "Source")
      ?.value ??
    "15 min delay";
  const isOverview = presentation === "overview";

  return (
    <Tabs
      value={activeRange}
      onValueChange={(value) => setActiveRange(value as StockChartRange)}
      className="w-full"
    >
      <ChartFrame
        className={cn(
          "alqis-stock-chart-card shadow-[0_30px_92px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.035)]",
          isOverview && "rounded-[0.65rem]"
        )}
        title={
          <span className="inline-flex items-center gap-2">
            Proof of move
            <ExplainThis termId="proof-of-move" compact />
          </span>
        }
        subtitle={
          isOverview
            ? "Price action shown with available evidence context."
            : "Chart and evidence signals that test whether the ALQIS Read fits price action."
        }
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <div className="flex flex-wrap items-center gap-1.5">
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
            <div className="scrollbar-hide flex gap-1 overflow-x-auto whitespace-nowrap" aria-label="Chart ranges">
              {referenceRanges.map((range) =>
                range.enabled ? (
                  <button
                    key={range.label}
                    type="button"
                    onClick={() => setActiveRange(range.value)}
                    className={cn(
                      "h-7 flex-shrink-0 rounded border px-2 text-[0.68rem] font-black",
                      activeRange === range.value
                        ? "border-accent-secondary bg-accent-secondary text-[#06121a]"
                        : "border-[#2f72d5]/24 bg-[#07111f]/70 text-[#9db0ca]"
                    )}
                  >
                    {range.label}
                  </button>
                ) : (
                  <button
                    key={range.label}
                    type="button"
                    disabled
                    title="Data limited"
                    className="h-7 flex-shrink-0 rounded border border-[#2f72d5]/14 bg-[#07111f]/38 px-2 text-[0.68rem] font-black text-[#5f7592]"
                  >
                    {range.label}
                  </button>
                )
              )}
            </div>
          </div>
        }
      >
        {ranges.map((range) => {
          const chart = getChartRange(data, range);
          const source = chart.stats.find((stat) => stat.label === "Source")?.value;
          const isFallback = source === "Chart provider unavailable" || source === "Demo fallback";

          return (
            <TabsContent key={range} value={range} className={cn("mt-0", isOverview ? "space-y-3" : "space-y-5")}>
              <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-[#2f72d5]/18 px-1 pb-2 text-[0.72rem] font-semibold text-[#9db0ca]">
                <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded border border-[#2f72d5]/28 bg-[#07111f]/68 px-2 py-1">
                  <BarChart3 className="h-3.5 w-3.5 text-accent-secondary" />
                  {chart.subtitle}
                </span>
                <LegendChip label="News" />
                <LegendChip label="Earnings" tone="warn" />
                <LegendChip label="AI Insight" tone="ai" />
              </div>

              <PriceLineChart
                data={chart.points}
                markers={isFallback ? [] : chart.markers}
                markersDisabled={isFallback}
                className={cn("alqis-stock-chart-field", isOverview && "min-h-[22rem]")}
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

              <p className="border-t border-[#2f72d5]/18 px-1 pt-2 text-[0.72rem] font-medium text-[#91a9c6]">
                Click a marker to inspect sample evidence context.
              </p>

              {isOverview && !selectedInsights[range] ? null : (
              <div className="rounded-[1.25rem] border border-accent-secondary/16 bg-[linear-gradient(180deg,rgba(12,30,52,0.76)_0%,rgba(6,15,27,0.84)_100%)] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="section-kicker text-accent-ai">
                    Proof of move
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
                    Demo chart structure is not live proof. Demo markers are
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
              )}

              {!isOverview ? (
              <div className="grid gap-2.5 sm:grid-cols-3">
                {chart.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="alqis-stock-stat-card rounded-[1rem] px-4 py-3"
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
              ) : null}

              {!isOverview ? (
              <div className="rounded-[1.25rem] border border-accent-secondary/16 bg-accent-secondary/8 px-4 py-3.5">
                <div className="flex items-center gap-2 text-body-sm text-ink-subtle">
                  <BrainCircuit className="h-4 w-4 text-accent-ai" />
                  {isFallback ? "Chart provider status" : "How the chart supports the read"}
                </div>
                <p className="mt-2 text-body text-ink-muted">{chart.footer}</p>
              </div>
              ) : null}
            </TabsContent>
          );
        })}
      </ChartFrame>
    </Tabs>
  );
}

function LegendChip({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "warn" | "ai";
}) {
  return (
    <span
      className={cn(
        "inline-flex flex-shrink-0 items-center gap-1.5 rounded border px-2 py-1",
        tone === "warn"
          ? "border-warn/28 bg-warn-bg/20 text-warn"
          : tone === "ai"
            ? "border-accent-ai/28 bg-accent-ai/12 text-accent-ai"
            : "border-[#2f72d5]/28 bg-[#07111f]/68 text-[#9db0ca]"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function getChartRange(data: typeof stockDetailDemoData, range: StockChartRange) {
  return data.chartRanges?.[range] ?? stockDetailDemoData.chartRanges[range];
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
