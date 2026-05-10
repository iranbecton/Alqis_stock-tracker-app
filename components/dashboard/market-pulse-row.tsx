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
    label: "Russell 2000",
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
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker text-accent-ai">Proof second</p>
          <h2 className="mt-2 font-serif text-[1.7rem] leading-tight text-ink sm:text-[2.4rem]">
            Market pulse
          </h2>
        </div>
        <Badge variant="outline" size="sm" className="normal-case tracking-normal">
          Demo data
        </Badge>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="grid min-w-[52rem] grid-cols-6 gap-3">
          {pulseItems.map((item) => {
            const isUp = item.change >= 0;

            return (
              <article
                key={item.label}
                className="rounded-[var(--radius-xl)] border border-border/68 bg-[color-mix(in_srgb,var(--surface-elevated)_80%,var(--surface)_20%)] p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-ink" data-numeric>
                      {item.value}
                    </p>
                  </div>
                  <span
                    className={isUp ? "text-sm font-medium text-gain" : "text-sm font-medium text-loss"}
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
                  className="mt-3 w-full"
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
