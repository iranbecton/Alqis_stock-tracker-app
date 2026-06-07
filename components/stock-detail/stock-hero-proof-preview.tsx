"use client";

import { BarChart3 } from "lucide-react";
import { PriceLineChart } from "@/components/alqis/price-line-chart";
import { Badge } from "@/components/ui/badge";
import type { ChartRangeData } from "@/lib/stock-detail-demo-data";

type StockHeroProofPreviewProps = {
  chart: ChartRangeData;
  rangeLabel: string;
};

export function StockHeroProofPreview({
  chart,
  rangeLabel,
}: StockHeroProofPreviewProps) {
  const stats = Array.isArray(chart.stats) ? chart.stats : [];
  const points = Array.isArray(chart.points) ? chart.points : [];
  const markers = Array.isArray(chart.markers) ? chart.markers : [];
  const source = stats.find((stat) => stat.label === "Source")?.value;
  const isFallback = source === "Chart provider unavailable" || source === "Demo fallback";
  const windowMove =
    stats.find((stat) => stat.label.toLowerCase().includes("move"))
      ?.value ?? "Window move unavailable";

  return (
    <section className="rounded-[1.35rem] border border-[#2f72d5]/24 bg-[radial-gradient(circle_at_78%_12%,rgba(52,157,255,0.12),transparent_18rem),linear-gradient(180deg,rgba(10,24,43,0.72)_0%,rgba(5,12,22,0.88)_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_16px_52px_rgba(0,0,0,0.28)] sm:p-3.5">
      <div className="mb-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="section-kicker text-accent-secondary">Proof preview</p>
          <h2 className="mt-1 text-base font-medium tracking-tight text-ink sm:text-lg">
            Price action behind the read
          </h2>
          <p className="mt-1 text-body-sm leading-6 text-ink-muted">
            Compact {rangeLabel} preview. Open the Proof tab for full markers
            and evidence notes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={isFallback ? "ai" : "outline"} size="sm" className="normal-case tracking-normal">
            {isFallback ? "Chart data limited" : source ?? "Chart source"}
          </Badge>
          <Badge variant="outline" size="sm" className="normal-case tracking-normal">
            <BarChart3 className="h-3.5 w-3.5" />
            {windowMove}
          </Badge>
        </div>
      </div>

      <PriceLineChart
        data={points}
        markers={isFallback ? [] : markers}
        markersDisabled
        className="alqis-stock-chart-field"
        variant="compact"
      />
    </section>
  );
}
