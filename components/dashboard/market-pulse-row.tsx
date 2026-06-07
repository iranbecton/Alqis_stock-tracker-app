import { TrendingUp } from "lucide-react";
import { SparklineChart } from "@/components/alqis/sparkline-chart";
import { Badge } from "@/components/ui/badge";

const pulseItems = [
  {
    label: "S&P 500",
    value: "5,287",
    change: 0.42,
    points: [5260, 5268, 5264, 5274, 5282, 5287],
  },
  {
    label: "Nasdaq",
    value: "16,742",
    change: 0.71,
    points: [16610, 16648, 16622, 16690, 16720, 16742],
  },
  {
    label: "Dow",
    value: "39,118",
    change: -0.08,
    points: [39160, 39142, 39180, 39121, 39134, 39118],
  },
  {
    label: "R2K",
    value: "2,083",
    change: 0.19,
    points: [2074, 2079, 2075, 2080, 2081, 2083],
  },
  {
    label: "10Y Yield",
    value: "4.42%",
    change: -0.03,
    points: [4.46, 4.45, 4.44, 4.43, 4.44, 4.42],
  },
  {
    label: "BTC",
    value: "$64.8K",
    change: 0.58,
    points: [64200, 64410, 64120, 64600, 64720, 64800],
  },
];

export function MarketPulseRow() {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="section-kicker inline-flex items-center gap-2 text-[var(--ink-muted)]">
          <TrendingUp className="h-3.5 w-3.5 text-[var(--accent)]" />
          Futures / Market Pulse
        </p>
        <Badge variant="outline" size="sm" className="normal-case tracking-normal">
          Static preview
        </Badge>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="grid min-w-[52rem] grid-cols-6 gap-3">
          {pulseItems.map((item) => {
            const isUp = item.change >= 0;

            return (
              <article
                key={item.label}
                className="rounded-[0.9rem] border p-3"
                style={{
                  background: `radial-gradient(circle at 90% 8%, color-mix(in srgb, ${isUp ? "var(--gain)" : "var(--loss)"} 12%, transparent), transparent 42%), linear-gradient(180deg, #102032 0%, #07111d 100%)`,
                  borderColor: `color-mix(in srgb, ${isUp ? "var(--gain)" : "var(--loss)"} 24%, rgba(86,126,176,0.26))`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 26px rgba(0,0,0,0.44), 0 0 18px color-mix(in srgb, ${isUp ? "var(--gain)" : "var(--loss)"} 10%, transparent)`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">{item.label}</p>
                    <p className="mt-1 text-lg font-black text-[var(--ink)]" data-numeric>
                      {item.value}
                    </p>
                  </div>
                  <span
                    className={isUp ? "text-sm font-black text-[var(--gain)]" : "text-sm font-black text-[var(--loss)]"}
                    data-numeric
                  >
                    {isUp ? "+" : ""}
                    {item.change.toFixed(2)}%
                  </span>
                </div>
                <SparklineChart
                  data={item.points.map((value, index) => ({
                    label: String(index + 1),
                    value,
                  }))}
                  trend={isUp ? "up" : "down"}
                  className="mt-2 w-full"
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
