"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  CircleDollarSign,
  Clock3,
  Layers3,
  LayoutDashboard,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { SparklineChart } from "@/components/alqis/sparkline-chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Delta } from "@/components/ui/delta";
import type { ExplanationHistoryItem } from "@/lib/explanations/types";
import { stockDetailDemoData, type StockChartRange } from "@/lib/stock-detail-demo-data";
import { getDeepDivePreviewData } from "@/lib/stocks/deep-dive-preview-data";
import type { StockDataHealth } from "@/lib/stocks/stock-data-health";
import { cn, formatLargeNumber } from "@/lib/utils";
import { StockCatalystFeed } from "./stock-catalyst-feed";
import { StockChartCard } from "./stock-chart-card";
import { StockWhyCard } from "./stock-why-card";

type StockWorkspaceData = typeof stockDetailDemoData;
type DataStatus = "live" | "data-limited" | "unavailable";
type ProviderMetric = {
  label: string;
  value: number | string | null;
  format: "currency" | "multiple" | "percent" | "text";
  limited: boolean;
};
type StockApiState<T> = {
  data: T | null;
  loading: boolean;
  error: boolean;
};
type FinancialsApiResponse = {
  symbol: string;
  dataStatus: DataStatus;
  period: string | null;
  currency: string | null;
  profile: {
    symbol: string;
    companyName: string | null;
    description: string | null;
    sector: string | null;
    industry: string | null;
    country: string | null;
    marketCap: number | null;
    employees: number | null;
    beta: number | null;
    volume: number | null;
    range: string | null;
    ceo: string | null;
    website: string | null;
  } | null;
  annualTrend: Array<{
    label: string;
    fiscalYear: string | null;
    revenue: number | null;
    netIncome: number | null;
  }>;
  snapshot: ProviderMetric[];
  valuation: ProviderMetric[];
  keyMetrics: ProviderMetric[];
};
type SegmentsApiResponse = {
  symbol: string;
  dataStatus: DataStatus;
  period: string | null;
  currency: string | null;
  items: Array<{
    name: string;
    revenue: number;
    share: number | null;
    yoy: number | null;
    trend: Array<{
      label: string | null;
      value: number | null;
    }>;
  }>;
};
type HistoryApiResponse = {
  symbol: string;
  dataStatus: DataStatus;
  summary: string;
  rows: Array<{
    quarter: string;
    fiscalDateEnding?: string | null;
    period?: string | null;
    date: string | null;
    epsActual: number | null;
    epsEstimated: number | null;
    revenueActual: number | null;
    revenueEstimated: number | null;
    verdict: "BEAT" | "MISSED" | "IN-LINE" | "PROVIDER LIMITED";
    nextDayDelta: null;
    nextDayDeltaLabel: string;
  }>;
};

type StockIntelligenceNavigatorProps = {
  data: StockWorkspaceData;
  dataHealth?: StockDataHealth;
  recentReads?: ExplanationHistoryItem[];
  defaultChartRange?: StockChartRange;
};

const workspaceTabs = [
  { id: "overview", label: "Overview", description: "Read + proof", icon: LayoutDashboard },
  { id: "financials", label: "Financials", description: "Financial context", icon: CircleDollarSign },
  { id: "segments", label: "Segments", description: "Revenue mix", icon: Layers3 },
  { id: "history", label: "History", description: "Past reads", icon: Clock3 },
  { id: "business", label: "Business", description: "Business model", icon: Building2 },
  { id: "risk", label: "Risks", description: "What to watch", icon: ShieldAlert },
  { id: "peers", label: "Peers", description: "Relative movement", icon: UsersRound },
] as const;

type WorkspaceTabId = (typeof workspaceTabs)[number]["id"];

export function StockIntelligenceNavigator({
  data,
  dataHealth,
  defaultChartRange = "1d",
}: StockIntelligenceNavigatorProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>("overview");
  const financials = useStockApi<FinancialsApiResponse>(
    data.company.symbol,
    "financials"
  );
  const preview = useMemo(
    () => getDeepDivePreviewData(data.company.symbol, data.company.sector),
    [data.company.sector, data.company.symbol]
  );
  const activeTabMeta =
    workspaceTabs.find((tab) => tab.id === activeTab) ?? workspaceTabs[0];
  const ActiveIcon = activeTabMeta.icon;

  return (
    <section aria-labelledby="stock-workspace-title" className="relative space-y-3">
      <div className="relative flex flex-col gap-2 border-y border-[#2f72d5]/16 bg-[#050b14]/42 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <p id="stock-workspace-title" className="section-kicker text-accent-secondary">
            Stock intelligence
          </p>
          <span className="hidden h-3 w-px bg-[#446890]/42 sm:block" aria-hidden />
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7189a8]">
            Read / proof / context
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="ai" size="sm" className="normal-case tracking-normal">
            Overview first
          </Badge>
          <Badge variant="outline" size="sm" className="normal-case tracking-normal">
            Static preview where noted
          </Badge>
        </div>
      </div>

      <div
        role="tablist"
        aria-label={`${data.company.symbol} stock workspace tabs`}
        className="scrollbar-hide sticky top-2 z-20 flex gap-1 overflow-x-auto whitespace-nowrap border border-[#28466f]/70 border-b border-b-white/10 bg-[#28466f]/70 p-px shadow-[0_20px_54px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(128,217,225,0.08)] backdrop-blur-xl lg:grid lg:grid-cols-[repeat(7,minmax(8rem,1fr))] lg:gap-px lg:whitespace-normal"
      >
        {workspaceTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`stock-workspace-panel-${tab.id}`}
              id={`stock-workspace-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group flex min-h-11 min-w-[8.5rem] flex-shrink-0 items-center gap-2 px-2.5 py-2 text-left transition-[border-color,background-color,color,transform] duration-[var(--duration-fast)] hover:bg-[#10233a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3",
                isActive
                  ? "bg-[linear-gradient(180deg,#163459,#0a182b)] text-ink shadow-[inset_0_2px_0_rgba(128,217,225,0.72),0_8px_24px_rgba(35,98,178,0.18)]"
                  : "bg-[linear-gradient(180deg,#07111f,#050b14)] text-ink-muted"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-accent-secondary" : "text-accent-ai")} />
              <span>
                <span className={cn("block text-[0.78rem] font-semibold leading-4", isActive ? "text-ink" : "text-[#8fa5c2]")}>{tab.label}</span>
                <span className="hidden text-[0.68rem] leading-4 text-ink-subtle sm:block">{tab.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={`stock-workspace-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`stock-workspace-tab-${activeTab}`}
        className="outline-none"
      >
        {activeTab === "overview" ? null : (
        <div className="mb-3 flex flex-col gap-2 border-b border-[#2f72d5]/14 bg-[#050b14]/28 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center border border-accent-secondary/18 bg-accent-secondary/10 text-accent-secondary">
              <ActiveIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{activeTabMeta.label}</p>
              <p className="text-xs text-ink-muted">{activeTabMeta.description}</p>
            </div>
          </div>
          {["risk", "peers"].includes(activeTab) ? (
            <StaticPreviewBadge />
          ) : null}
        </div>
        )}

        {renderActivePanel({
          activeTab,
          data,
          dataHealth,
          defaultChartRange,
          preview,
          financials,
        })}
      </div>
    </section>
  );
}

export function StockPrimaryWorkstation({
  data,
  defaultChartRange = "1d",
}: {
  data: StockWorkspaceData;
  defaultChartRange?: StockChartRange;
}) {
  return (
    <section aria-label={`${data.company.symbol} proof and ALQIS Read`} className="relative">
      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.24fr)_minmax(22rem,0.76fr)] xl:items-start">
        <div className="space-y-2.5">
          <StockChartCard data={data} defaultRange={defaultChartRange} presentation="overview" />
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <p className="border-l-2 border-accent-secondary/70 bg-[#06111f]/60 px-3 py-2 text-xs leading-5 text-[#91a9c6]">
              Price action shown with available evidence context. Select a marker
              when interactive evidence is available.
            </p>
            <Badge variant="outline" size="sm" className="w-fit normal-case tracking-normal">
              Proof second
            </Badge>
          </div>
        </div>
        <StockWhyCard data={data} density="compact" />
      </div>
    </section>
  );
}

export function StockReferenceContextDeck({
  data,
  dataHealth,
}: {
  data: StockWorkspaceData;
  dataHealth?: StockDataHealth;
}) {
  return (
    <section aria-label={`${data.company.symbol} data and evidence context`} className="space-y-3">
      <StatsStrip data={data} dataHealth={dataHealth} />
      <EvidenceStackPanel data={data} />
    </section>
  );
}

function renderActivePanel({
  activeTab,
  data,
  dataHealth,
  defaultChartRange,
  preview,
  financials,
}: {
  activeTab: WorkspaceTabId;
  data: StockWorkspaceData;
  dataHealth?: StockDataHealth;
  defaultChartRange: StockChartRange;
  preview: ReturnType<typeof getDeepDivePreviewData>;
  financials: StockApiState<FinancialsApiResponse>;
}) {
  if (activeTab === "overview") {
    return (
      <OverviewPanel
        data={data}
        dataHealth={dataHealth}
        defaultChartRange={defaultChartRange}
        financials={financials}
      />
    );
  }

  if (activeTab === "business") {
    return <BusinessPanel preview={preview} financials={financials} />;
  }

  if (activeTab === "financials") {
    return <FinancialsPanel financials={financials} />;
  }

  if (activeTab === "segments") {
    return <SegmentsPanel data={data} />;
  }

  if (activeTab === "risk") {
    return <RiskPanel data={data} preview={preview} />;
  }

  if (activeTab === "peers") {
    return <PeersPanel data={data} />;
  }

  if (activeTab === "history") {
    return <HistoryPanel data={data} />;
  }

  return <OverviewPanel data={data} dataHealth={dataHealth} defaultChartRange={defaultChartRange} financials={financials} />;
}

function OverviewPanel({
  data,
  dataHealth,
  defaultChartRange,
  financials,
}: {
  data: StockWorkspaceData;
  dataHealth?: StockDataHealth;
  defaultChartRange: StockChartRange;
  financials: StockApiState<FinancialsApiResponse>;
}) {
  return (
    <div className="space-y-3">
      <StockPrimaryWorkstation data={data} defaultChartRange={defaultChartRange} />
      <StatsStrip data={data} dataHealth={dataHealth} financials={financials} />
      <EvidenceStackPanel data={data} />
      <CatalystsPanel data={data} dataHealth={dataHealth} compact />
    </div>
  );
}

function StatsStrip({
  data,
  dataHealth,
  financials,
}: {
  data: StockWorkspaceData;
  dataHealth?: StockDataHealth;
  financials?: StockApiState<FinancialsApiResponse>;
}) {
  const metrics = getOverviewMetrics(data, financials?.data).slice(0, 8);
  const hasLimitedMetrics = metrics.some((metric) =>
    /demo|unavailable|pending/i.test(metric.value)
  );

  return (
    <section
      aria-label="Stock data strip"
      className="relative overflow-hidden rounded-[1rem] border border-[#2f72d5]/22 bg-[linear-gradient(90deg,rgba(13,34,63,0.72)_0%,rgba(8,18,32,0.78)_100%)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#2f72d5]/14 px-3 py-2">
        <p className="section-kicker text-accent-secondary">Data strip</p>
        <Badge
          variant={hasLimitedMetrics || dataHealth?.overallStatus !== "complete" ? "ai" : "outline"}
          size="sm"
          className="normal-case tracking-normal"
        >
          {hasLimitedMetrics ? "Data limited" : "Live where provider-backed"}
        </Badge>
      </div>
      <div className="scrollbar-dark flex gap-px overflow-x-auto">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="min-w-[8.75rem] flex-1 border-r border-[#2f72d5]/12 px-3 py-2.5 last:border-r-0"
          >
            <p className="section-kicker text-[#7189a8]">{metric.label}</p>
            <p className="mt-1 text-base font-semibold text-[#f5f1e8]" data-numeric title={metric.context}>
              {formatStatsStripValue(metric.label, metric.value)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EvidenceStackPanel({ data }: { data: StockWorkspaceData }) {
  const reasons = asArray(data.explanation.reasons).slice(0, 4);
  const counterEvidence = asArray(data.explanation.counterEvidence).slice(0, 2);

  return (
    <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.16fr)_minmax(24rem,0.84fr)]">
      <section className="alqis-stock-panel rounded-[0.85rem] p-2.5 sm:p-3">
        <div className="relative mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="section-kicker text-accent-secondary">Why {data.company.symbol} moved today</p>
            <h3 className="mt-0.5 text-sm font-semibold text-[#f5f1e8]">Structured evidence stack</h3>
          </div>
          <Badge variant="ai" size="sm" className="normal-case tracking-normal">
            {data.explanation.sourceCount} sources
          </Badge>
        </div>
        <div className="relative divide-y divide-[#2f72d5]/12 rounded-[0.7rem] border border-[#446890]/26 bg-[#07111f]/58">
          {reasons.length ? (
            reasons.map((reason, index) => (
              <article
                key={reason.label}
                className="grid gap-2 px-2.5 py-2 md:grid-cols-[1.75rem_minmax(0,1fr)_4.25rem] md:items-center"
              >
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent-secondary">
                  0{index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#f5f1e8]">{reason.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#91a9c6]">{reason.detail}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-right text-xs font-semibold text-ink" data-numeric>
                    {reason.score}%
                  </p>
                  <div className="h-1.5 rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,rgba(73,145,255,0.92),rgba(142,216,208,0.82))]"
                      style={{ width: `${reason.score}%` }}
                    />
                  </div>
                </div>
              </article>
            ))
          ) : (
            <DataLimitedState message="Structured factors are not available for this read yet." />
          )}
        </div>
      </section>

      <section className="alqis-stock-panel rounded-[0.85rem] p-2.5 sm:p-3">
        <div className="relative mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="section-kicker text-warn">Challenges read</p>
            <h3 className="mt-0.5 text-sm font-semibold text-[#f5f1e8]">Counterevidence visible</h3>
          </div>
          <Badge variant="outline" size="sm" className="normal-case tracking-normal">
            Data quality
          </Badge>
        </div>
        <div className="relative space-y-1.5">
          {counterEvidence.length ? (
            counterEvidence.map((item) => (
              <article
                key={item.label}
                className="rounded-[0.75rem] border border-warn/16 bg-warn-bg/18 px-3 py-2.5"
              >
                <p className="text-sm font-semibold text-[#f5f1e8]">{item.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-[#b8c4d4]">{item.detail}</p>
              </article>
            ))
          ) : (
            <DataLimitedState message="Counterevidence is not available for this read yet." />
          )}
        </div>
      </section>
    </div>
  );
}

function BusinessPanel({
  preview,
  financials,
}: {
  preview: ReturnType<typeof getDeepDivePreviewData>;
  financials: StockApiState<FinancialsApiResponse>;
}) {
  const revenueDrivers = asArray(preview.revenueDrivers);
  const customerCategories = asArray(preview.customerCategories);
  const profile = financials.data?.profile;
  const modelBlocks = [
    ["Industry", profile?.industry ?? "—", "Company profile field from connected fundamentals."],
    ["Sector", profile?.sector ?? "—", "Company profile field from connected fundamentals."],
    ["Employees", formatEmployees(profile?.employees), "Reported employee count when available."],
    ["HQ", profile?.country ?? "—", "Country from the connected company profile."],
  ] as const;

  return (
    <WorkspacePanel
      eyebrow="Business context"
      title="Business model in plain English."
      description="How the company makes money, and which operating factors can support or challenge the current read."
      label={<ProviderStatusBadge status={financials.data?.dataStatus} loading={financials.loading} error={financials.error} />}
    >
      <TabSummaryBanner>
        The model in one sentence: <Highlight>{getBusinessModelSentence(profile?.description)}</Highlight>
      </TabSummaryBanner>
      <div className="mt-3 grid gap-3 xl:grid-cols-4">
        {modelBlocks.map(([label, value, detail]) => (
          <ResearchPanel key={label} title={label}>
            <p className="mt-2 text-2xl font-black text-ink" data-numeric>{value}</p>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{detail}</p>
          </ResearchPanel>
        ))}
      </div>
      <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card variant="subtle" radius="xl" className="border-accent-secondary/14 bg-[#07111f]/70">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardEyebrow>Operating context</CardEyebrow>
              <StaticPreviewBadge />
            </div>
            <CardTitle>Revenue paths and customer groups.</CardTitle>
            <CardDescription>Company fundamentals are not yet connected for this context.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <ContextList title="Revenue drivers" items={revenueDrivers} />
            <ContextList title="Customer categories" items={customerCategories} />
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SupportChallengeCard
            title="Supports the business"
            items={asArray(preview.businessSupports)}
            tone="support"
          />
          <SupportChallengeCard
            title="Challenges the business"
            items={asArray(preview.businessChallenges)}
            tone="challenge"
          />
        </div>
      </div>
    </WorkspacePanel>
  );
}

function FinancialsPanel({
  financials,
}: {
  financials: StockApiState<FinancialsApiResponse>;
}) {
  const payload = financials.data;
  const trend = payload?.annualTrend ?? [];
  const maxTrendValue = Math.max(
    1,
    ...trend.flatMap((item) => [item.revenue ?? 0, item.netIncome ?? 0])
  );

  return (
    <WorkspacePanel
      eyebrow="Financial context"
      title="Fundamental trend and valuation context."
      description="Provider-backed annual fundamentals. Limited fields stay labeled instead of filled with placeholder values."
      label={<ProviderStatusBadge status={payload?.dataStatus} loading={financials.loading} error={financials.error} />}
    >
      {financials.loading ? (
        <FundamentalsSkeleton />
      ) : financials.error || !payload || payload.dataStatus === "unavailable" ? (
        <DataLimitedState
          label="Data limited"
          message="Fundamental data is unavailable for this ticker right now."
        />
      ) : (
        <>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
            <ResearchPanel title="Annual revenue / net income">
              {trend.length ? (
                <>
                  <div className="mt-4 flex h-52 items-end gap-5 px-2 sm:px-4">
                    {trend.map((item) => (
                      <div key={`${item.label}-${item.fiscalYear}`} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-36 w-full max-w-24 items-end justify-center gap-1.5">
                          <span
                            className="w-1/2 rounded-t-md bg-info"
                            style={{ height: `${Math.max(3, ((item.revenue ?? 0) / maxTrendValue) * 100)}%` }}
                            title={`Revenue ${formatCompactCurrency(item.revenue)}`}
                          />
                          <span
                            className="w-1/2 rounded-t-md bg-accent-ai"
                            style={{ height: `${Math.max(3, ((item.netIncome ?? 0) / maxTrendValue) * 100)}%` }}
                            title={`Net income ${formatCompactCurrency(item.netIncome)}`}
                          />
                        </div>
                        <span className="text-xs text-ink-subtle">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-ink-subtle">
                    <LegendDot label="Revenue" color="var(--info)" />
                    <LegendDot label="Net income" color="var(--accent-ai)" />
                  </div>
                </>
              ) : (
                <DataLimitedState message="Annual income statement trend is provider limited for this ticker." />
              )}
            </ResearchPanel>
            <ResearchPanel title="Cash & return snapshot">
              <div className="mt-3 divide-y divide-border/55">
                {payload.snapshot.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="text-ink-muted">{item.label}</span>
                    <MetricValue metric={item} />
                  </div>
                ))}
              </div>
            </ResearchPanel>
          </div>
          <ResearchPanel title="Valuation metrics" className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                <thead className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-subtle">
                  <tr className="border-b border-border/70">
                    <th className="py-3">Metric</th>
                    <th>Current</th>
                      <th>Peer (Sample data)</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.valuation.map((item) => (
                    <tr key={item.label} className="border-b border-border/45 last:border-b-0">
                      <td className="py-3.5 font-black text-ink">{item.label}</td>
                      <td><MetricValue metric={item} /></td>
                      <td className="text-ink-muted">Sample peer</td>
                      <td className="text-right">
                        {item.limited ? (
                          <span className="text-xs font-semibold text-warn">Data limited</span>
                        ) : (
                          <span className="text-xs font-semibold text-accent-secondary">Provider data</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ResearchPanel>
          <LiveKeyMetricsPanel metrics={payload.keyMetrics} />
        </>
      )}
    </WorkspacePanel>
  );
}

function SegmentsPanel({
  data,
}: {
  data: StockWorkspaceData;
}) {
  const segments = useStockApi<SegmentsApiResponse>(data.company.symbol, "segments");
  const payload = segments.data;
  const items = payload?.items ?? [];
  const maxTrendValue = Math.max(
    1,
    ...items.flatMap((item) => item.trend.map((point) => point.value ?? 0))
  );

  return (
    <WorkspacePanel
      eyebrow="Segment context"
      title="Revenue mix by product line."
      description="Provider-backed segment revenue where available for this ticker and account tier."
      label={<ProviderStatusBadge status={payload?.dataStatus} loading={segments.loading} error={segments.error} />}
    >
      {segments.loading ? (
        <FundamentalsSkeleton />
      ) : segments.error || !payload || payload.dataStatus === "unavailable" || !items.length ? (
        <DataLimitedState
          label="Data limited"
          message="Segment data not available for this ticker."
        />
      ) : (
        <ResearchPanel title={`Latest product revenue mix${payload.period ? ` (${payload.period})` : ""}`}>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full border border-[#446890]/26 bg-[#07111f]/82">
            {items.map((item, index) => (
              <span
                key={item.name}
                className={cn(index % 5 === 0 && "bg-info", index % 5 === 1 && "bg-accent-ai", index % 5 === 2 && "bg-gain", index % 5 === 3 && "bg-warn", index % 5 === 4 && "bg-loss")}
                style={{ flexGrow: Math.max(1, item.share ?? 0.01) }}
                aria-hidden
              />
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
              <thead className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-subtle">
                <tr className="border-b border-border/60">
                  <th className="py-3">Segment</th>
                  <th>Revenue</th>
                  <th>Share</th>
                  <th>YoY</th>
                  <th>Trend</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.name} className="border-b border-border/45 last:border-b-0">
                    <td className="py-3 font-black text-ink">{item.name}</td>
                    <td className="font-black text-ink" data-numeric>{formatCompactCurrency(item.revenue)}</td>
                    <td data-numeric>{formatPercentRatio(item.share)}</td>
                    <td className={cn("font-black", typeof item.yoy === "number" ? item.yoy >= 0 ? "text-gain" : "text-loss" : "text-ink-subtle")} data-numeric>
                      {typeof item.yoy === "number" ? formatSignedPercent(item.yoy) : "—"}
                    </td>
                    <td>
                      <MiniBars
                        values={item.trend.map((point) => ((point.value ?? 0) / maxTrendValue) * 100)}
                        color={typeof item.yoy === "number" && item.yoy < 0 ? "var(--warn)" : "var(--info)"}
                      />
                    </td>
                    <td className="text-ink-muted">Provider data</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ResearchPanel>
      )}
    </WorkspacePanel>
  );
}

function RiskPanel({
  data,
  preview,
}: {
  data: StockWorkspaceData;
  preview: ReturnType<typeof getDeepDivePreviewData>;
}) {
  const risks = asArray(preview.risks).slice(0, 5);

  return (
    <WorkspacePanel
      eyebrow="Risk context"
      title="What could challenge the read."
      description="Risk context keeps uncertainty visible without turning it into a trading signal."
      label={<StaticPreviewBadge />}
    >
      <TabSummaryBanner>
        Two risks dominate current coverage: <Highlight>{risks[0]?.title ?? "Demand visibility"}</Highlight> and <Highlight>{risks[1]?.title ?? "margin durability"}</Highlight>. Other factors are secondary or narrative-driven at this stage.
      </TabSummaryBanner>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
        <div className="mt-3 grid gap-2">
          {risks.map((risk, index) => {
            const width = risk.severity === "Higher" ? 82 : risk.severity === "Moderate" ? 58 : 32;
            const label = risk.severity === "Higher" ? (index === 1 ? "High & escalating" : "High & ongoing") : risk.severity === "Moderate" ? "Medium - narrative" : "Lower - small line";

            return (
            <details
              key={risk.title}
              className="group rounded-[0.9rem] border border-[#446890]/32 bg-[#07111f]/68"
            >
              <summary className="grid cursor-pointer list-none gap-3 px-3 py-3 md:grid-cols-[2.5rem_minmax(0,1fr)_16rem_1rem] md:items-center">
                <span className="font-black text-info">#{index + 1}</span>
                <span className="font-black text-ink">{risk.title}</span>
                <span className="grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-3">
                  <span className="h-1.5 rounded-full bg-info/12"><span className={risk.severity === "Higher" ? "block h-full rounded-full bg-loss" : "block h-full rounded-full bg-warn"} style={{ width: `${width}%` }} /></span>
                  <span className="text-xs text-ink-muted">{label}</span>
                </span>
                <span className="text-right text-xs text-ink-subtle transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="border-t border-border/45 px-3 pb-3 pt-2">
                <p className="text-body-sm leading-6 text-ink-muted">{risk.context}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <RiskNote label="Mitigants" value={risk.mitigation} />
                  <RiskNote label="What to watch" value={risk.watch} />
                </div>
              </div>
            </details>
            );
          })}
        </div>

        <Card variant="subtle" radius="xl" className="mt-3 h-fit border-accent-ai/12">
          <CardHeader>
            <CardEyebrow>What would change this read</CardEyebrow>
            <CardTitle>Current evidence triggers.</CardTitle>
            <CardDescription>
              Evidence thresholds that could shift the structured read.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {asArray(data.explanation.changeTriggers).slice(0, 4).map((trigger, index) => (
              <div
                key={trigger}
                className="rounded-[var(--radius-md)] border border-accent-ai/10 bg-[color-mix(in_srgb,var(--surface)_72%,var(--accent-ai)_8%)] px-4 py-3"
              >
                <p className="section-kicker">Trigger 0{index + 1}</p>
                <p className="mt-2 text-body-sm leading-6 text-ink-muted">{trigger}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </WorkspacePanel>
  );
}

function PeersPanel({ data }: { data: StockWorkspaceData }) {
  const peers = asArray(data.peers);

  return (
    <WorkspacePanel
      eyebrow="Peer context"
      title="Relative movement and sector read-through."
      description="Similar names help test whether the move is isolated or showing up across related market context."
      label={<StaticPreviewBadge />}
    >
      {peers.length ? (
        <>
          <div className="hidden overflow-x-auto rounded-[1.25rem] border border-[#446890]/32 bg-[#07111f]/68 md:block">
            <div className="min-w-[44rem]">
              <div className="grid grid-cols-[0.85fr_1.3fr_0.85fr_1.15fr_9rem] gap-4 border-b border-border/60 px-4 py-3 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink-subtle">
                <span>Ticker</span>
                <span>Company</span>
                <span>Move</span>
                <span>Context</span>
                <span>Trend</span>
              </div>
              {peers.map((peer) => (
                <div
                  key={peer.symbol}
                  className="grid grid-cols-[0.85fr_1.3fr_0.85fr_1.15fr_9rem] items-center gap-4 border-b border-border/45 px-4 py-4 last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-ink">{peer.symbol}</p>
                    <p className="mt-1 text-xs text-ink-subtle">{peer.timeframe}</p>
                  </div>
                  <p className="text-body-sm text-ink-muted">{peer.name}</p>
                  <Delta value={peer.changePct} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-ink">{peer.readThrough}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-subtle">{peer.note}</p>
                  </div>
                  <SparklineChart
                    data={peer.points}
                    trend={peer.changePct >= 0 ? "up" : "down"}
                    className="h-10 w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {peers.map((peer) => (
              <article
                key={`${peer.symbol}-mobile`}
                className="rounded-[1.1rem] border border-[#446890]/32 bg-[#07111f]/68 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-medium text-ink">{peer.symbol}</p>
                    <p className="mt-1 text-body-sm text-ink-muted">{peer.name}</p>
                  </div>
                  <Delta value={peer.changePct} size="sm" />
                </div>
                <p className="mt-3 text-sm font-medium text-ink">{peer.readThrough}</p>
                <p className="mt-1 text-body-sm leading-6 text-ink-muted">{peer.note}</p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <DataLimitedState message="Peer context is not available for this ticker yet." />
      )}
    </WorkspacePanel>
  );
}

function CatalystsPanel({
  data,
  dataHealth,
  compact = false,
}: {
  data: StockWorkspaceData;
  dataHealth?: StockDataHealth;
  compact?: boolean;
}) {
  const isLimited = dataHealth?.newsStatus && dataHealth.newsStatus !== "ok";

  return (
    <WorkspacePanel
      eyebrow="Catalyst feed"
      title="Recent evidence tied to the read."
      description="Headlines and context items stay connected to why ALQIS included them."
      label={
        isLimited ? (
          <Badge variant="ai" size="sm" className="normal-case tracking-normal">
            Data limited
          </Badge>
        ) : (
          <Badge variant="outline" size="sm" className="normal-case tracking-normal">
            Provider context
          </Badge>
        )
      }
    >
      <StockCatalystFeed ticker={data.company.symbol} compact={compact} />
    </WorkspacePanel>
  );
}

function HistoryPanel({
  data,
}: {
  data: StockWorkspaceData;
}) {
  const history = useStockApi<HistoryApiResponse>(data.company.symbol, "history");
  const payload = history.data;

  return (
    <WorkspacePanel
      eyebrow="History"
      title="Earnings reaction history."
      description={payload?.summary ?? "Historical EPS outcomes load from the connected fundamentals provider."}
      label={<ProviderStatusBadge status={payload?.dataStatus} loading={history.loading} error={history.error} />}
    >
      {history.loading ? (
        <FundamentalsSkeleton />
      ) : history.error || !payload || payload.dataStatus === "unavailable" || !payload.rows.length ? (
        <DataLimitedState
          label="Data limited"
          message="Historical earnings data is not available for this ticker right now."
        />
      ) : (
        <ResearchPanel title="Last reported quarters">
          {(() => {
            const quarterLabels = getDistinctFiscalQuarterLabels(payload.rows);

            return (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
              <thead className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-subtle">
                <tr className="border-b border-border/60">
                  <th className="py-3">Quarter</th>
                  <th>Date</th>
                  <th>EPS - Act / Est</th>
                  <th>Revenue - Act / Est</th>
                  <th>Verdict</th>
                  <th>Next-day Δ — provider limited</th>
                </tr>
              </thead>
              <tbody>
                {payload.rows.map((row, index) => {
                  const epsBeat =
                    typeof row.epsActual === "number" &&
                    typeof row.epsEstimated === "number" &&
                    row.epsActual > row.epsEstimated;
                  const revBeat =
                    typeof row.revenueActual === "number" &&
                    typeof row.revenueEstimated === "number" &&
                    row.revenueActual > row.revenueEstimated;
                  return (
                    <tr key={`${row.date}-${index}`} className="border-b border-border/45 last:border-b-0">
                      <td className="py-3.5 font-black text-ink">{quarterLabels[index]}</td>
                      <td className="text-ink-muted">{formatShortDate(row.date)}</td>
                      <td data-numeric>
                        <span className={epsBeat ? "font-black text-gain" : "font-black text-ink"}>
                          {formatCurrencyNumber(row.epsActual)}
                        </span>
                        <span className="text-ink-subtle"> / {formatCurrencyNumber(row.epsEstimated)}</span>
                      </td>
                      <td data-numeric>
                        <span className={revBeat ? "font-black text-gain" : "font-black text-ink"}>
                          {formatCompactCurrency(row.revenueActual)}
                        </span>
                        <span className="text-ink-subtle"> / {formatCompactCurrency(row.revenueEstimated)}</span>
                      </td>
                      <td><VerdictBadge verdict={row.verdict} /></td>
                      <td className="font-black text-ink-subtle" data-numeric title={row.nextDayDeltaLabel}>—</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            );
          })()}
        </ResearchPanel>
      )}
    </WorkspacePanel>
  );
}

function LiveKeyMetricsPanel({ metrics }: { metrics: ProviderMetric[] }) {
  return (
    <Card variant="subtle" radius="xl" className="mt-4 border-accent-secondary/14 bg-[#07111f]/70">
      <CardHeader>
        <CardEyebrow>Key metrics</CardEyebrow>
        <CardTitle>Market data tied to the move.</CardTitle>
        <CardDescription>
          Provider-backed fundamentals stay secondary to the ALQIS Read.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="dense-finance-grid">
          {metrics.map((metric) => (
            <div key={metric.label} className="dense-finance-row">
              <div>
                <p className="text-sm font-medium text-ink">{metric.label}</p>
                <p className="mt-1 text-body-sm text-ink-muted">
                  {metric.limited ? "Data limited" : "Provider data"}
                </p>
              </div>
              <MetricValue metric={metric} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProviderStatusBadge({
  status,
  loading,
  error,
}: {
  status?: DataStatus;
  loading?: boolean;
  error?: boolean;
}) {
  if (loading) {
    return (
      <Badge variant="outline" size="sm" className="normal-case tracking-normal">
        Loading
      </Badge>
    );
  }

  if (error || status === "unavailable") {
    return (
      <Badge variant="ai" size="sm" className="normal-case tracking-normal">
        Data limited
      </Badge>
    );
  }

  if (status === "data-limited") {
    return (
      <Badge variant="ai" size="sm" className="normal-case tracking-normal">
        Data limited
      </Badge>
    );
  }

  return (
    <Badge variant="outline" size="sm" className="normal-case tracking-normal">
      Live data
    </Badge>
  );
}

function MetricValue({ metric }: { metric: ProviderMetric }) {
  if (metric.limited) {
    return (
      <span className="font-black text-ink-subtle" data-numeric title="Data limited">
        —
      </span>
    );
  }

  return (
    <span className="font-black text-ink" data-numeric>
      {formatProviderMetric(metric)}
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict: HistoryApiResponse["rows"][number]["verdict"] }) {
  const className =
    verdict === "BEAT"
      ? "bg-gain/16 text-gain"
      : verdict === "MISSED"
        ? "bg-warn/18 text-warn"
        : "bg-info/14 text-info";

  return (
    <span className={cn("rounded px-2 py-1 text-[0.62rem] font-black uppercase", className)}>
      {verdict === "PROVIDER LIMITED" ? "Limited" : verdict}
    </span>
  );
}

function FundamentalsSkeleton() {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-56 animate-pulse rounded-[1rem] border border-[#446890]/28 bg-[#07111f]/68"
        />
      ))}
    </div>
  );
}

function ResearchPanel({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("alqis-stock-panel rounded-[1rem] p-3.5 sm:p-4", className)}>
      <p className="relative section-kicker text-info">{title}</p>
      <div className="relative">{children}</div>
    </section>
  );
}

function TabSummaryBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[0.85rem] border border-accent-ai/14 bg-accent-ai/8 px-4 py-3 text-sm font-semibold leading-6 text-ink">
      {children}
    </div>
  );
}

function Highlight({ children }: { children: ReactNode }) {
  return <span className="font-black text-accent-secondary">{children}</span>;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function MiniBars({ values, color }: { values: readonly number[]; color: string }) {
  return (
    <span className="inline-flex h-8 items-end gap-1">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="w-2 rounded-t-sm opacity-80"
          style={{ height: `${value}%`, background: color }}
        />
      ))}
    </span>
  );
}

function WorkspacePanel({
  eyebrow,
  title,
  description,
  label,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  label?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="alqis-stock-panel rounded-[1.25rem] p-3.5 sm:p-4">
      <div className="relative mb-3 flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="section-kicker text-accent-secondary">{eyebrow}</p>
          <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-[#f5f1e8] sm:text-[1.35rem]">
            {title}
          </h3>
          <p className="mt-1.5 text-body-sm leading-6 text-[#a9bad0]">{description}</p>
        </div>
        {label ? <div className="shrink-0">{label}</div> : null}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

function ContextList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-[1.1rem] border border-[#446890]/32 bg-[#07111f]/58 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="section-kicker">{title}</p>
        <StaticPreviewBadge />
      </div>
      {items.length ? (
        <ul className="mt-3 space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-body-sm leading-6 text-ink-muted">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-secondary" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-body-sm text-ink-muted">Context unavailable.</p>
      )}
    </section>
  );
}

function SupportChallengeCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "support" | "challenge";
}) {
  return (
    <article
      className={cn(
        "rounded-[1.25rem] border p-4",
        tone === "support"
          ? "border-accent-secondary/16 bg-accent-secondary/8"
          : "border-warn/16 bg-warn-bg/18"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="section-kicker">{title}</p>
        <StaticPreviewBadge />
      </div>
      {items.length ? (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item} className="text-body-sm leading-6 text-ink-muted">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-body-sm text-ink-muted">Context unavailable.</p>
      )}
    </article>
  );
}

function RiskNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[#446890]/32 bg-[#07111f]/58 px-3 py-3">
      <p className="section-kicker">{label}</p>
      <p className="mt-2 text-body-sm leading-6 text-ink-muted">{value}</p>
    </div>
  );
}

function StaticPreviewBadge() {
  return (
    <Badge variant="outline" size="sm" className="normal-case tracking-normal">
      Static preview
    </Badge>
  );
}

function DataLimitedState({
  message,
  label = "Data limited",
}: {
  message: string;
  label?: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-[#446890]/44 bg-[#07111f]/58 px-5 py-6">
      <Badge variant="ai" size="sm" className="normal-case tracking-normal">
        {label}
      </Badge>
      <p className="mt-3 text-body leading-7 text-ink-muted">{message}</p>
    </div>
  );
}

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function getOverviewMetrics(
  data: StockWorkspaceData,
  financials?: FinancialsApiResponse | null
) {
  const keyMetrics = financials?.keyMetrics ?? [];
  const byLabel = new Map(keyMetrics.map((metric) => [metric.label.toLowerCase(), metric]));
  const marketCap =
    byLabel.get("market cap") ??
    (financials?.profile?.marketCap
      ? metricFromValue("Market cap", financials.profile.marketCap, "currency")
      : null);
  const beta =
    typeof financials?.profile?.beta === "number"
      ? metricFromValue("Beta", financials.profile.beta, "text")
      : null;
  const fiftyTwoWeekHigh = getRangeHigh(financials?.profile?.range);
  const volume =
    typeof financials?.profile?.volume === "number"
      ? metricFromValue("Volume", financials.profile.volume, "text")
      : null;

  return [
    toOverviewMetric("Market cap", marketCap, data),
    toOverviewMetric("P/E", byLabel.get("p/e"), data),
    toOverviewMetric("Fwd P/E", byLabel.get("fwd p/e"), data),
    toOverviewMetric("EPS", byLabel.get("eps"), data),
    toOverviewMetric("Div yield", byLabel.get("fcf yield"), data, "FCF yield used as provider-backed proxy."),
    toOverviewMetric("Beta", beta, data),
    toOverviewMetric(
      "52W high",
      typeof fiftyTwoWeekHigh === "number"
        ? metricFromValue("52W high", fiftyTwoWeekHigh, "currency")
        : null,
      data
    ),
    toOverviewMetric("Volume", volume, data),
  ];
}

function toOverviewMetric(
  label: string,
  metric: ProviderMetric | null | undefined,
  data: StockWorkspaceData,
  contextOverride?: string
) {
  if (metric && !metric.limited) {
    return {
      label,
      value: formatProviderMetric(metric),
      context: contextOverride ?? "Provider data",
    };
  }

  const fallback = asArray(data.metrics).find(
    (item) => item.label.toLowerCase() === label.toLowerCase()
  );

  return {
    label,
    value: fallback?.value ?? "—",
    context: contextOverride ?? fallback?.context ?? "Data limited",
  };
}

function metricFromValue(
  label: string,
  value: number,
  format: ProviderMetric["format"]
): ProviderMetric {
  return {
    label,
    value,
    format,
    limited: false,
  };
}

function getRangeHigh(range: string | null | undefined) {
  if (!range) {
    return null;
  }

  const [, high] = range.split("-").map((value) => Number(value.trim()));

  return Number.isFinite(high) ? high : null;
}

function formatStatsStripValue(label: string, value: string) {
  if (!/market cap/i.test(label)) {
    return value;
  }

  const numericValue = Number(value.replace(/[$,]/g, ""));

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return formatLargeNumber(numericValue);
}

function useStockApi<T>(symbol: string, path: "financials" | "segments" | "history") {
  const [state, setState] = useState<StockApiState<T>>({
    data: null,
    loading: true,
    error: false,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/stocks/${encodeURIComponent(symbol)}/${path}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Provider unavailable");
        }

        return response.json() as Promise<T>;
      })
      .then((payload) => {
        if (!controller.signal.aborted) {
          setState({ data: payload, loading: false, error: false });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error?.name !== "AbortError") {
          setState({ data: null, loading: false, error: true });
        }
      });

    return () => controller.abort();
  }, [path, symbol]);

  return state;
}

function formatProviderMetric(metric: ProviderMetric) {
  if (metric.format === "currency") {
    return typeof metric.value === "number"
      ? formatCurrencyNumber(metric.value)
      : String(metric.value);
  }

  if (metric.format === "percent") {
    return typeof metric.value === "number"
      ? formatPercentRatio(metric.value)
      : String(metric.value);
  }

  if (metric.format === "multiple") {
    return typeof metric.value === "number"
      ? `${formatNumber(metric.value)}x`
      : String(metric.value);
  }

  if (typeof metric.value === "number") {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(metric.value);
  }

  return String(metric.value);
}

function getBusinessModelSentence(description: string | null | undefined) {
  if (!description) {
    return "Company description is provider limited for this ticker.";
  }

  const firstSentence = description.match(/.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? description.trim();

  return truncateText(firstSentence, 200);
}

function truncateText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1).trim()}…`;
}

function formatEmployees(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyNumber(value: number | string | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }

  if (Math.abs(value) >= 1_000_000) {
    return formatLargeNumber(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactCurrency(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }

  return formatLargeNumber(value);
}

function formatPercentRatio(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatSignedPercent(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(value);

  return `${formatted}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatShortDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function getDistinctFiscalQuarterLabels(rows: HistoryApiResponse["rows"]) {
  const derivedLabels = rows.map((row) => deriveFiscalQuarterLabel(row));
  const uniqueCount = new Set(derivedLabels).size;

  if (uniqueCount === derivedLabels.length) {
    return derivedLabels;
  }

  const firstFiscalPeriod =
    parseFiscalPeriod(rows[0]?.fiscalDateEnding, rows[0]?.period) ??
    estimateFiscalPeriodFromAnnouncement(rows[0]?.date);

  if (!firstFiscalPeriod) {
    return derivedLabels;
  }

  return rows.map((_, index) => formatFiscalPeriod(decrementFiscalQuarter(firstFiscalPeriod, index)));
}

function deriveFiscalQuarterLabel(row: HistoryApiResponse["rows"][number]) {
  const fiscalPeriod =
    parseFiscalPeriod(row.fiscalDateEnding, row.period) ??
    estimateFiscalPeriodFromAnnouncement(row.date);

  return fiscalPeriod ? formatFiscalPeriod(fiscalPeriod) : row.quarter;
}

function parseFiscalPeriod(fiscalDateEnding?: string | null, period?: string | null) {
  if (period) {
    const normalizedPeriod = period.trim().toUpperCase();
    const periodMatch = normalizedPeriod.match(/^Q([1-4])\s*(?:FY)?(\d{2,4})?$/);

    if (periodMatch?.[1]) {
      const quarter = Number(periodMatch[1]);
      const year = periodMatch[2]
        ? normalizeFiscalYear(Number(periodMatch[2]))
        : fiscalYearFromDate(fiscalDateEnding);

      if (year) {
        return { quarter, year };
      }
    }
  }

  return fiscalQuarterFromDate(fiscalDateEnding);
}

function estimateFiscalPeriodFromAnnouncement(date: string | null | undefined) {
  if (!date) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setUTCDate(parsed.getUTCDate() - 45);

  return fiscalQuarterFromDate(parsed.toISOString().slice(0, 10));
}

function fiscalQuarterFromDate(date: string | null | undefined) {
  const year = fiscalYearFromDate(date);

  if (!date || !year) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    quarter: Math.floor(parsed.getUTCMonth() / 3) + 1,
    year,
  };
}

function fiscalYearFromDate(date: string | null | undefined) {
  if (!date) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.getUTCFullYear();
}

function normalizeFiscalYear(year: number) {
  if (!Number.isFinite(year)) {
    return null;
  }

  return year < 100 ? 2000 + year : year;
}

function decrementFiscalQuarter(
  period: {
    quarter: number;
    year: number;
  },
  offset: number
) {
  const zeroBased = (period.year * 4 + (period.quarter - 1)) - offset;

  return {
    year: Math.floor(zeroBased / 4),
    quarter: (zeroBased % 4) + 1,
  };
}

function formatFiscalPeriod(period: { quarter: number; year: number }) {
  return `Q${period.quarter} FY${String(period.year).slice(-2)}`;
}
