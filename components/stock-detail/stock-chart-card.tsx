"use client";

import { BarChart3, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChartFrame } from "@/components/ui/chart-frame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stockDetailDemoData, type StockChartRange } from "@/lib/stock-detail-demo-data";
import { PriceLineChart } from "@/components/alqis/price-line-chart";

const ranges: StockChartRange[] = ["1d", "5d", "1m"];

type StockChartCardProps = {
  data?: typeof stockDetailDemoData;
};

export function StockChartCard({ data = stockDetailDemoData }: StockChartCardProps) {
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
    <Tabs defaultValue="1d" className="w-full">
      <ChartFrame
        className="border-accent-secondary/10"
        title="Proof of move"
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

              <PriceLineChart data={chart.points} markers={chart.markers} />

              <div className="grid gap-2.5 sm:grid-cols-3">
                {chart.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[var(--radius-lg)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_84%,var(--surface)_16%)] px-4 py-3"
                  >
                    <p className="section-kicker text-ink-muted">{stat.label}</p>
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
