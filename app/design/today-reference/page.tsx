import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  BarChart3,
  Calendar,
  Clock,
  Eye,
  Moon,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

const navItems = ["Today", "Watchlist", "Portfolio", "Explore", "Alerts", "Learn"];

const sessionTabs = [
  { label: "Pre-market", icon: "🇺🇸" },
  { label: "Midday", icon: "●" },
  { label: "After close", icon: "✦" },
  { label: "Weekend", icon: "▣" },
  { label: "Earnings", icon: "▥" },
];

const pulseCards = [
  { label: "S&P Fut", value: "5,798.50", move: "+0.34%", tone: "gain", path: "M2 18 C12 16 16 10 25 12 C35 14 42 4 58 3" },
  { label: "Nas Fut", value: "20,284.25", move: "+0.51%", tone: "gain", path: "M2 19 C14 17 20 15 28 12 C38 8 45 9 58 3" },
  { label: "Dow Fut", value: "42,210.00", move: "+0.22%", tone: "gain", path: "M2 17 C11 18 17 9 25 12 C36 15 45 5 58 7" },
  { label: "R2K Fut", value: "2,280.10", move: "+0.07%", tone: "gain", path: "M2 18 C12 16 18 15 25 13 C36 10 42 8 58 3" },
  { label: "10Y", value: "4.18%", move: "-0.07%", tone: "loss", path: "M2 6 C13 5 18 7 27 9 C39 12 47 13 58 17" },
  { label: "BTC", value: "67,843.00", move: "-2.14%", tone: "loss", path: "M2 5 C12 3 20 8 28 7 C38 6 48 13 58 16" },
];

const holdings = [
  { symbol: "NVDA", weight: "28%", shares: "45 sh", move: "+4.32%", tone: "gain", path: "M2 19 C11 17 17 15 25 15 C35 14 43 8 58 6" },
  { symbol: "AAPL", weight: "10%", shares: "80 sh", move: "-1.14%", tone: "loss", path: "M2 7 C12 9 16 16 24 15 C34 20 42 18 58 10" },
  { symbol: "MSFT", weight: "9%", shares: "32 sh", move: "+0.43%", tone: "gain", path: "M2 18 C13 18 18 14 26 16 C36 18 44 10 58 8" },
  { symbol: "AMD", weight: "7%", shares: "60 sh", move: "+5.67%", tone: "gain", path: "M2 20 C12 18 19 16 27 14 C38 10 48 8 58 5" },
  { symbol: "GOOGL", weight: "11%", shares: "90 sh", move: "+1.52%", tone: "gain", path: "M2 18 C12 16 21 17 29 14 C39 12 46 8 58 6" },
];

const movers = [
  { symbol: "SMCI", value: "$982.40", move: "+8.40%", path: "M2 18 C12 16 18 11 26 13 C36 9 44 5 58 3" },
  { symbol: "AMD", value: "$164.82", move: "+5.67%", path: "M2 20 C12 18 20 15 28 13 C38 10 47 8 58 5" },
  { symbol: "NVDA", value: "$887.45", move: "+4.32%", path: "M2 19 C12 18 20 16 28 13 C38 13 46 7 58 6" },
  { symbol: "AVGO", value: "$1742.50", move: "+3.21%", path: "M2 12 C12 20 20 16 28 10 C38 12 46 8 58 5" },
  { symbol: "META", value: "$523.18", move: "+3.21%", path: "M2 19 C12 16 19 15 27 12 C37 9 47 7 58 4" },
];

const heatmap = [
  { label: "Tech", move: "+1.84%", tone: "gain", span: "col-span-4" },
  { label: "Comm.", move: "+1.42%", tone: "gain", span: "col-span-2" },
  { label: "Cons. Disc.", move: "+0.74%", tone: "gain", span: "col-span-2" },
  { label: "Fin.", move: "+0.31%", tone: "gain", span: "col-span-2" },
  { label: "Indust.", move: "+0.18%", tone: "gain", span: "col-span-1" },
  { label: "Health", move: "-0.04%", tone: "loss", span: "col-span-2" },
  { label: "Mat.", move: "-0.21%", tone: "loss", span: "col-span-1" },
  { label: "RE", move: "-0.40%", tone: "loss", span: "col-span-1" },
  { label: "Util.", move: "-0.62%", tone: "loss", span: "col-span-1" },
  { label: "Staples", move: "-0.81%", tone: "loss", span: "col-span-1" },
  { label: "Energy", move: "-1.27%", tone: "loss", span: "col-span-1" },
];

const negativeHeatmapBackgrounds: Record<string, string> = {
  Energy: "linear-gradient(135deg, color-mix(in srgb, #ff6f82 78%, #0c1622) 0%, color-mix(in srgb, #e0556b 58%, #07111d) 100%)",
  Staples: "linear-gradient(135deg, color-mix(in srgb, #ff6f82 64%, #0c1622) 0%, color-mix(in srgb, #e0556b 48%, #07111d) 100%)",
  "Util.": "linear-gradient(135deg, color-mix(in srgb, #ff6f82 56%, #0c1622) 0%, color-mix(in srgb, #e0556b 40%, #07111d) 100%)",
  RE: "linear-gradient(135deg, color-mix(in srgb, #ff6f82 48%, #0c1622) 0%, color-mix(in srgb, #e0556b 34%, #07111d) 100%)",
  "Mat.": "linear-gradient(135deg, color-mix(in srgb, #ff6f82 38%, #0c1622) 0%, color-mix(in srgb, #e0556b 28%, #07111d) 100%)",
  Health: "linear-gradient(135deg, color-mix(in srgb, #ff6f82 30%, #0c1622) 0%, color-mix(in srgb, #e0556b 22%, #07111d) 100%)",
};

const newsRows = [
  { title: "Stocks extend rally as Fed-pause narrative gains traction", source: "Bloomberg", time: "12m", tags: ["MARKETS", "NVDA", "AMD", "SMCI"], tone: "gain" },
  { title: "NVIDIA reports record datacenter revenue, raises guidance", source: "Reuters", time: "34m", tags: ["EARNINGS", "NVDA"], tone: "gain" },
  { title: "PCE inflation prints at 2.6%, in line with consensus", source: "WSJ", time: "1h", tags: ["MACRO", "SPY", "QQQ"], tone: "warn" },
  { title: "EU opens DMA investigation into Apple App Store practices", source: "CNBC", time: "2h", tags: ["REGULATION", "AAPL"], tone: "loss" },
  { title: "Bitcoin drops below $68K as Fed comments push yields higher", source: "FT", time: "3h", tags: ["CRYPTO", "BTC", "COIN"], tone: "loss" },
];

const earningsRows = [
  ["TODAY AMC", "CRM", "Salesforce", "est $2.36", ""],
  ["TODAY AMC", "CRWD", "CrowdStrike", "est $0.93", ""],
  ["TUE BMO", "WMT", "Walmart", "est $0.52", ""],
  ["WED AMC", "NVDA", "NVIDIA", "est $5.59", "BEAT $6.12"],
  ["THU BMO", "COST", "Costco", "est $3.78", ""],
];

export default function TodayReferencePage() {
  return (
    <main
      className="min-h-dvh overflow-x-hidden text-[var(--ink)]"
      style={{
        "--ink": "#f4f8ff",
        "--ink-muted": "#a7b7cc",
        "--ink-subtle": "#74869d",
        "--accent": "#75e7dc",
        "--gain": "#39e2a0",
        "--loss": "#ff7580",
        "--info": "#86b7d4",
        background: "linear-gradient(180deg, #03060b 0%, #06101b 46%, #03060b 100%)",
      } as CSSProperties}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_8%,rgba(35,92,142,0.24),transparent_34rem),radial-gradient(ellipse_at_70%_24%,rgba(92,84,180,0.13),transparent_36rem),radial-gradient(ellipse_at_34%_22%,rgba(45,184,170,0.11),transparent_30rem),linear-gradient(180deg,#03060b,#06101b_48%,#03060b)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(125,166,217,0.009)_1px,transparent_1px),linear-gradient(90deg,rgba(125,166,217,0.008)_1px,transparent_1px)] bg-[size:118px_118px] opacity-[0.065] [mask-image:linear-gradient(180deg,#000,transparent_68%)]" />
      <div className="relative z-10">
        <TopNav />
        <section className="mx-auto w-full max-w-[82rem] px-4 pb-12 pt-4 sm:px-6">
          <PrototypeBanner />
          <HeroBrief />
          <MarketPulse />
          <PrimaryGrid />
          <ContextBreak />
          <SectorHeatmap />
          <BottomGrid />
          <Disclaimer />
        </section>
      </div>
    </main>
  );
}

function TopNav() {
  return (
    <header className="border-b border-[rgba(86,126,176,0.18)] bg-[rgba(4,8,15,0.92)] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[82rem] px-4 sm:px-6">
        <div className="relative flex h-8 items-center justify-between text-[0.62rem] font-black uppercase tracking-[0.22em] text-[var(--ink-subtle)]">
          <p>VOL. 1 <span className="mx-2 text-[var(--border-strong)]">/</span> ISSUE 274</p>
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-[rgba(139,132,199,0.36)] bg-[linear-gradient(135deg,rgba(85,82,148,0.36),rgba(22,30,54,0.78))] text-[0.7rem] font-black text-[var(--ink)] shadow-[0_0_12px_rgba(139,132,199,0.1)]">
              A
            </span>
            <span className="text-sm font-black normal-case tracking-tight text-[var(--ink)]">ALQIS</span>
          </div>
          <p className="hidden sm:block">TUE - APR 22 - 2026 <span className="mx-2 text-[var(--border-strong)]">/</span> EDITION 3</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-[rgba(70,105,150,0.1)] py-2 lg:flex-row lg:items-center">
          <nav className="scrollbar-hide flex gap-1.5 overflow-x-auto" aria-label="Today prototype navigation">
            {navItems.map((item) => (
              <Link
                href="/dashboard"
                key={item}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  item === "Today"
                    ? "bg-[rgba(55,92,154,0.24)] text-[#a7b7cc] shadow-[0_0_10px_rgba(91,140,255,0.1)]"
                    : "text-[var(--ink-subtle)] hover:bg-[rgba(12,22,38,0.72)] hover:text-[var(--ink-muted)]"
                }`}
              >
                {item}
              </Link>
            ))}
          </nav>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[rgba(86,126,176,0.22)] bg-[rgba(7,13,24,0.9)] px-3 py-2 text-xs text-[var(--ink-muted)] lg:ml-6">
            <Search className="h-3.5 w-3.5 text-[var(--ink-subtle)]" />
            <span className="truncate">Search a ticker, ask anything...</span>
            <span className="ml-auto rounded border border-[var(--border)] px-1.5 py-0.5 text-[0.62rem] text-[var(--ink-subtle)]">Ctrl K</span>
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            <div className="flex items-center gap-2 rounded-lg border border-[rgba(86,126,176,0.22)] bg-[rgba(7,13,24,0.92)] px-3 py-1.5 text-xs font-black">
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-[var(--ink-subtle)]">TODAY</p>
                <p data-numeric>+$2,143</p>
              </div>
              <Sparkline path="M2 18 C12 15 18 13 26 10 C37 6 45 8 58 3" color="var(--gain)" />
              <span className="text-[var(--gain)]" data-numeric>+1.52%</span>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(91,140,255,0.32)] bg-[rgba(10,21,38,0.92)] px-3 py-2 text-xs font-black text-[#a7b7cc]">
              <Plus className="h-3.5 w-3.5" />
              Ask ALQIS
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-full border border-[rgba(139,132,199,0.34)] bg-[rgba(28,36,68,0.72)] text-xs font-black shadow-[0_0_10px_rgba(139,132,199,0.1)]">
              A
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function PrototypeBanner() {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(117,231,220,0.18)] bg-[radial-gradient(ellipse_at_12%_0%,rgba(117,231,220,0.055),transparent_34%),linear-gradient(180deg,rgba(10,20,35,0.96),rgba(5,10,18,0.94))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_28px_rgba(2,6,12,0.28)]">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--accent)]">VISUAL PROTOTYPE — SAMPLE DATA</p>
      <p className="text-xs text-[var(--ink-muted)]">Static mockup for layout review. No live providers are connected.</p>
    </div>
  );
}

function HeroBrief() {
  return (
    <section className="space-y-4">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto rounded-xl border border-[rgba(86,126,176,0.22)] bg-[linear-gradient(180deg,rgba(10,20,35,0.96),rgba(5,10,18,0.93))] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_10px_26px_rgba(2,6,12,0.25)]">
        {sessionTabs.map((tab) => (
          <span
            key={tab.label}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black ${
              tab.label === "Pre-market"
                ? "bg-[linear-gradient(180deg,rgba(55,92,154,0.34),rgba(20,42,72,0.34))] text-[#d0e0f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_14px_rgba(91,140,255,0.08)]"
                : "text-[var(--ink-subtle)]"
            }`}
          >
            <span className={tab.label === "Midday" ? "text-[var(--warn)]" : tab.label === "After close" ? "text-[var(--accent-ai)]" : tab.label === "Weekend" ? "text-[var(--info)]" : "text-[var(--accent)]"}>
              {tab.icon}
            </span>
            {tab.label}
          </span>
        ))}
      </div>
      <div
        className="relative overflow-hidden rounded-[1.4rem] border border-[var(--border-strong)] p-6 sm:p-8"
        style={{
          background:
            "radial-gradient(ellipse at 86% 0%, rgba(96,130,210,0.18), transparent 42%), radial-gradient(ellipse at 8% 0%, rgba(117,231,220,0.12), transparent 38%), linear-gradient(180deg, #1d2d3c 0%, #132230 55%, #0d1825 100%)",
          borderColor: "rgba(108,155,205,0.34)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05), 0 30px 72px rgba(2,6,12,0.64), 0 0 46px rgba(117,231,220,0.08)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--ink-subtle)]">
            <span className="rounded-md bg-[color-mix(in_srgb,var(--info)_22%,transparent)] px-2 py-1 font-black uppercase tracking-[0.14em] text-[var(--info)]">PRE-MARKET</span>
            <span>7:42 AM ET · Tuesday, Apr 22</span>
          </div>
          <button className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink-muted)]">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        <h1 className="mt-5 max-w-5xl text-4xl leading-tight tracking-[-0.035em] text-[var(--ink)] drop-shadow-[0_14px_34px_rgba(2,6,12,0.45)] sm:text-5xl" style={{ fontFamily: "var(--font-serif)" }}>
          Hey Alex — <span className="italic text-[var(--accent)] drop-shadow-[0_0_18px_rgba(117,231,220,0.18)]" style={{ color: "#8cf4ed" }}>futures are bid as Fed minutes loom this afternoon.</span>
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--ink-muted)]">
          Risk assets are firmer pre-bell — S&amp;P futures +0.34%, Nasdaq +0.51%. The 10Y yield is easing to 4.18% on benign overnight macro. Fed minutes drop at 2pm ET, and CRM reports after the close.
        </p>

        <div className="mt-7 grid gap-3 lg:grid-cols-3">
          <HeroTile title="OVERNIGHT" icon={<Moon className="h-3.5 w-3.5 text-[var(--warn)]" />}>
            Asia closed mixed (Nikkei +0.4%, Hang Seng -0.2%). Europe is up ~0.3%. Crypto softened — BTC -2% after hawkish Fed-speak yesterday.
          </HeroTile>
          <HeroTile title="TODAY'S CATALYSTS" icon={<Zap className="h-3.5 w-3.5 text-[var(--warn)]" />}>
            Initial jobless claims at 8:30 AM. Fed Minutes at 2 PM — the biggest event of the day. CRM reports after the close; consensus around $2.36 EPS.
          </HeroTile>
          <HeroTile title="YOUR PORTFOLIO" icon={<Eye className="h-3.5 w-3.5 text-[var(--accent-ai)]" />}>
            Your tracked names are mixed pre-market — NVDA indicated higher, AMD higher, AAPL roughly flat. ALQIS separates direct catalysts from market context below.
          </HeroTile>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { label: "Why is NVDA up?", icon: <Sparkles className="h-3 w-3" /> },
            { label: "What changed for AAPL?", icon: <Eye className="h-3 w-3" /> },
            { label: "What are Fed Minutes?", icon: <Clock className="h-3 w-3" /> },
            { label: "Compare to last week", icon: <BarChart3 className="h-3 w-3" /> },
          ].map((chip) => (
          <button key={chip.label} className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(86,126,176,0.25)] bg-[rgba(7,13,24,0.82)] px-3 py-1.5 text-xs font-bold text-[var(--ink-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              {chip.icon}
              {chip.label}
            </button>
          ))}
          <button className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(117,231,220,0.55)] bg-[var(--accent)] px-3 py-1.5 text-xs font-black text-[#06121a] shadow-[0_0_20px_rgba(117,231,220,0.18),inset_0_1px_0_rgba(255,255,255,0.20)]">
            <Sparkles className="h-3 w-3" />
            Get ALQIS Read
          </button>
        </div>
      </div>
    </section>
  );
}

function HeroTile({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background:
          "radial-gradient(circle at 96% 0%, rgba(117,231,220,0.12), transparent 42%), linear-gradient(180deg, rgba(18,34,54,0.96) 0%, rgba(8,17,30,0.92) 100%)",
        borderColor: "rgba(108,155,205,0.34)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.075), inset 0 0 0 1px rgba(255,255,255,0.025), 0 12px 28px rgba(0,0,0,0.40)",
      }}
    >
      <p className="inline-flex items-center gap-1.5 text-[0.64rem] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
        {icon}
        {title}
      </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--ink-muted)]">{children}</p>
    </div>
  );
}

function MarketPulse() {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.2em] text-[var(--ink-muted)]">
          <TrendingUp className="h-3.5 w-3.5 text-[var(--accent)]" />
          FUTURES / MARKET PULSE
        </p>
        <span className="rounded-full border border-[rgba(86,126,176,0.28)] px-2 py-1 text-[0.65rem] font-bold text-[var(--ink-muted)]">Static preview</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {pulseCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value, move, tone, path }: { label: string; value: string; move: string; tone: string; path: string }) {
  const color = tone === "gain" ? "var(--gain)" : "var(--loss)";
  return (
    <div
      className="rounded-xl border border-[var(--border-strong)] p-3"
      style={{
        background: `radial-gradient(circle at 90% 8%, color-mix(in srgb, ${color} 12%, transparent), transparent 42%), linear-gradient(180deg, #102032 0%, #07111d 100%)`,
        borderColor: `color-mix(in srgb, ${color} 24%, rgba(86,126,176,0.26))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 26px rgba(0,0,0,0.44), 0 0 18px color-mix(in srgb, ${color} 10%, transparent)`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.65rem] font-black text-[var(--ink-muted)]">{label}</p>
          <p className="mt-1 text-lg font-black text-[var(--ink)]" data-numeric>{value}</p>
          <p className="text-xs font-black" style={{ color }} data-numeric>{move}</p>
        </div>
        <Sparkline path={path} color={color} />
      </div>
    </div>
  );
}

function PrimaryGrid() {
  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
      <PortfolioPanel />
      <div className="space-y-4">
        <TopMovers />
        <RecentReads />
      </div>
    </section>
  );
}

function PortfolioPanel() {
  return (
    <section
      className="rounded-2xl border border-[var(--border-strong)] p-5"
      style={{
        background:
          "radial-gradient(ellipse at 12% 0%, rgba(117,231,220,0.12), transparent 38%), radial-gradient(ellipse at 92% 16%, rgba(86,126,176,0.14), transparent 42%), linear-gradient(180deg, #1d2d3c 0%, #132230 55%, #0d1825 100%)",
        borderColor: "rgba(108,155,205,0.30)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05), 0 28px 64px rgba(2,6,12,0.62), 0 0 42px rgba(117,231,220,0.07)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            <BarChart3 className="h-3.5 w-3.5" />
            Your portfolio
          </p>
          <span className="mt-2 inline-flex rounded-full border border-[color-mix(in_srgb,var(--warn)_42%,transparent)] bg-[color-mix(in_srgb,var(--warn)_12%,transparent)] px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[var(--warn)]">
            SAMPLE PORTFOLIO — not your real holdings
          </span>
        </div>
        <button className="text-xs font-bold text-[var(--info)]">View all →</button>
      </div>

      <p className="mt-5 text-4xl font-black tracking-tight text-[var(--ink)]" data-numeric>$142,847.23</p>
      <p className="mt-1 text-sm font-black text-[var(--gain)]" data-numeric>▲ +$2,143.18 (+1.52%) today</p>

      <div className="mt-5 grid max-w-sm grid-cols-3 gap-4 border-y border-[var(--border)] py-3 text-xs">
        <Stat label="Week" value="+3.41%" tone="gain" />
        <Stat label="YTD" value="+18.7%" tone="gain" />
        <Stat label="Positions" value="5" />
      </div>

      <div className="mt-3 divide-y divide-[var(--border)]">
        {holdings.map((holding) => (
          <div key={holding.symbol} className="grid grid-cols-[4rem_3.5rem_minmax(4rem,1fr)_4rem_5rem] items-center gap-3 py-3 text-sm">
            <p className="font-black text-[var(--ink)]">{holding.symbol}</p>
            <p className="text-[var(--ink-subtle)]" data-numeric>{holding.weight}</p>
            <Sparkline path={holding.path} color={holding.tone === "gain" ? "var(--gain)" : "var(--loss)"} />
            <p className="text-right text-[var(--ink-subtle)]" data-numeric>{holding.shares}</p>
            <p className="text-right font-black" style={{ color: holding.tone === "gain" ? "var(--gain)" : "var(--loss)" }} data-numeric>{holding.move}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button className="rounded-xl border border-[rgba(117,231,220,0.32)] bg-[rgba(7,18,27,0.82)] px-4 py-3 text-sm font-black text-[var(--accent)]">
          Connect brokerage
        </button>
        <button className="rounded-xl border border-[rgba(91,140,255,0.3)] bg-[rgba(7,14,25,0.82)] px-4 py-3 text-sm font-black text-[var(--info)]">
          Add holdings manually
        </button>
      </div>
      <p className="mt-3 text-xs text-[var(--ink-subtle)]">Tracking only — ALQIS can&apos;t place trades.</p>
    </section>
  );
}

function TopMovers() {
  return (
    <section
      className="rounded-2xl border border-[var(--border-strong)] p-4"
      style={{
        background:
          "radial-gradient(ellipse at 18% 0%, rgba(57,226,160,0.12), transparent 36%), radial-gradient(ellipse at 94% 8%, rgba(117,231,220,0.11), transparent 38%), linear-gradient(180deg, #1d2d3c 0%, #132230 55%, #0d1825 100%)",
        borderColor: "rgba(108,155,205,0.30)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05), 0 28px 64px rgba(2,6,12,0.62), 0 0 42px rgba(57,226,160,0.07)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
          <TrendingUp className="h-3.5 w-3.5 text-[var(--gain)]" />
          Top movers
        </p>
        <div className="rounded-full bg-[rgba(7,13,24,0.82)] p-1 text-[0.62rem] font-black uppercase">
          <span className="rounded-full bg-[color-mix(in_srgb,var(--gain)_18%,transparent)] px-2 py-1 text-[var(--gain)]">Gainers</span>
          <span className="px-2 py-1 text-[var(--ink-subtle)]">Losers</span>
        </div>
      </div>
      <div className="mt-3 divide-y divide-[rgba(70,105,150,0.16)]">
        {movers.map((mover) => (
          <div key={mover.symbol} className="grid grid-cols-[4rem_minmax(4rem,1fr)_5rem_5rem] items-center gap-3 py-3 text-sm">
            <p className="font-black">{mover.symbol}</p>
            <Sparkline path={mover.path} color="var(--gain)" />
            <p className="text-right text-[var(--ink-muted)]" data-numeric>{mover.value}</p>
            <p className="text-right font-black text-[var(--gain)]" data-numeric>{mover.move}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentReads() {
  return (
    <section
      className="rounded-2xl border border-[var(--border-strong)] p-4"
      style={{
        background:
          "radial-gradient(circle at 8% 0%, rgba(117,231,220,0.075), transparent 30%), linear-gradient(180deg, #102032 0%, #07111d 100%)",
        borderColor: "rgba(108,155,205,0.28)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.055), 0 12px 30px rgba(0,0,0,0.42)",
      }}
    >
      <p className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        <Clock className="h-3.5 w-3.5 text-[var(--info)]" />
        Recent
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {["NVDA Today", "TSLA Today", "AMD Yesterday", "COIN Yesterday", "PLTR 2d ago", "AVGO 3d ago"].map((item) => (
          <span key={item} className="rounded-full border border-[rgba(117,231,220,0.24)] bg-[rgba(10,22,34,0.9)] px-3 py-1.5 text-xs font-bold text-[#bed3e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_14px_rgba(117,231,220,0.05)]">{item}</span>
        ))}
      </div>
    </section>
  );
}

function ContextBreak() {
  return (
    <div className="my-8 flex items-center gap-4">
      <div className="h-px flex-1 bg-[var(--border)]" />
      <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-[var(--ink-muted)]">MARKET CONTEXT · PREVIEW</p>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

function SectorHeatmap() {
  return (
    <section
      className="rounded-2xl border p-4"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, rgba(117,231,220,0.055), transparent 42%), linear-gradient(180deg, #102032 0%, #07111d 100%)",
        borderColor: "rgba(108,155,205,0.24)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.045), 0 9px 26px rgba(0,0,0,0.32)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          <BarChart3 className="h-3.5 w-3.5 text-[var(--accent)]" />
          SECTOR PERFORMANCE
        </p>
        <p className="rounded-full border border-[var(--border)] px-2 py-1 text-xs font-bold text-[var(--ink-muted)]">S&amp;P · weighted</p>
      </div>
      <div className="mt-4 grid min-h-36 grid-cols-12 gap-1.5 overflow-hidden">
        {heatmap.map((tile) => {
          const tileStyle = sectorTileStyle(tile.move);
          const negativeBackground = negativeHeatmapBackgrounds[tile.label];
          return (
            <div
              key={tile.label}
              className={`${tile.span} min-h-24 rounded-xl border p-3 text-xs font-black`}
              style={negativeBackground ? { ...tileStyle, background: negativeBackground } : tileStyle}
            >
              <p className="text-current">{tile.label}</p>
              <p className="mt-10 text-current drop-shadow" data-numeric>{tile.move}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BottomGrid() {
  return (
    <section className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <NewsPanel />
      <EarningsPanel />
    </section>
  );
}

function NewsPanel() {
  return (
    <section
      className="rounded-2xl border p-4"
      style={{
        background:
          "radial-gradient(circle at 8% 0%, rgba(61,91,160,0.07), transparent 30%), linear-gradient(180deg, #102033 0%, #06101b 100%)",
        borderColor: "rgba(108,155,205,0.26)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          <Newspaper className="h-3.5 w-3.5 text-[var(--accent-ai)]" />
          NEWS · AI-TAGGED
        </p>
        <span className="rounded-full border border-[var(--border-strong)] px-2 py-1 text-[0.65rem] font-bold text-[var(--ink-muted)]">Placeholder — not live</span>
      </div>
      <div className="mt-3 divide-y divide-[var(--border)]">
        {newsRows.map((row) => (
          <article key={row.title} className="grid gap-2 py-3 sm:grid-cols-[0.25rem_minmax(0,1fr)_auto]">
            <span className="rounded-full" style={{ background: toneColor(row.tone) }} />
            <div>
              <p className="font-bold text-[var(--ink)]">{row.title}</p>
              <p className="mt-1 text-xs text-[var(--ink-subtle)]">{row.source} · {row.time}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              {row.tags.map((tag) => (
                <span key={tag} className="rounded border border-[rgba(86,126,176,0.22)] bg-[rgba(7,13,24,0.82)] px-2 py-1 text-[0.62rem] font-black text-[var(--info)]">{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EarningsPanel() {
  return (
    <section
      className="rounded-2xl border p-4"
      style={{
        background:
          "radial-gradient(circle at 92% 0%, rgba(210,169,107,0.07), transparent 30%), linear-gradient(180deg, #102033 0%, #06101b 100%)",
        borderColor: "rgba(108,155,205,0.26)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          <Calendar className="h-3.5 w-3.5 text-[var(--warn)]" />
          EARNINGS THIS WEEK
        </p>
        <span className="rounded-full border border-[var(--border-strong)] px-2 py-1 text-[0.65rem] font-bold text-[var(--ink-muted)]">Static preview</span>
      </div>
      <div className="mt-4 divide-y divide-[var(--border)]">
        {earningsRows.map(([day, ticker, company, estimate, status]) => (
          <div key={`${day}-${ticker}`} className="grid grid-cols-[5rem_4rem_minmax(0,1fr)_5rem_auto] items-center gap-3 py-3 text-sm">
            <p className="text-xs font-black text-[var(--ink-subtle)]">{day}</p>
            <p className="font-black text-[var(--ink)]">{ticker}</p>
            <p className="truncate text-[var(--ink-muted)]">{company}</p>
            <p className="text-right text-xs text-[var(--ink-subtle)]">{estimate}</p>
            {status ? <span className="rounded bg-[color-mix(in_srgb,var(--gain)_18%,transparent)] px-2 py-1 text-[0.62rem] font-black text-[var(--gain)]">{status}</span> : <span className="text-[var(--warn)]">••</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <p className="mt-6 rounded-xl border border-[rgba(86,126,176,0.18)] bg-[linear-gradient(180deg,#0b1524_0%,#050b14_100%)] px-4 py-3 text-xs leading-5 text-[#a7b7cc] shadow-[inset_0_1px_0_rgba(255,255,255,0.028)]">
      ALQIS explanations are informational only and do not constitute investment advice. ALQIS is a tracking and explanation tool and cannot place trades. This route is a visual prototype with sample data; market pulse, sector, movers, news, and earnings modules are placeholders until live providers are connected.
    </p>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "gain" | "loss" }) {
  return (
    <div>
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[var(--ink-subtle)]">{label}</p>
      <p className="mt-1 font-black" style={{ color: tone ? toneColor(tone) : "var(--ink)" }} data-numeric>{value}</p>
    </div>
  );
}

function Sparkline({ path, color }: { path: string; color: string }) {
  return (
    <svg viewBox="0 0 60 22" className="h-6 w-16" style={{ color }} aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.25" style={{ filter: "drop-shadow(0 0 3px currentColor)" }} />
    </svg>
  );
}

function toneColor(tone: string) {
  if (tone === "loss") return "var(--loss)";
  if (tone === "warn") return "var(--warn)";
  if (tone === "info") return "var(--info)";
  return "var(--gain)";
}

function sectorTileStyle(move: string): CSSProperties {
  const value = Number.parseFloat(move.replace("%", ""));

  if (value >= 1.25) {
    return {
      background:
        "linear-gradient(135deg, color-mix(in srgb, #63cfa8 86%, #0c1622) 0%, color-mix(in srgb, #39e2a0 66%, #07111d) 100%)",
      borderColor: "rgba(99,207,168,0.46)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.11), inset 0 -16px 28px rgba(2,6,12,0.22), 0 0 22px rgba(99,207,168,0.14)",
      color: "#f2fff8",
    };
  }

  if (value >= 1) {
    return {
      background:
        "linear-gradient(135deg, color-mix(in srgb, #63cfa8 76%, #0c1622) 0%, color-mix(in srgb, #39e2a0 56%, #07111d) 100%)",
      borderColor: "rgba(99,207,168,0.38)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -16px 28px rgba(2,6,12,0.22)",
      color: "#f0f5ff",
    };
  }

  if (value >= 0.5) {
    return {
      background:
        "linear-gradient(135deg, color-mix(in srgb, #63cfa8 64%, #0c1622) 0%, color-mix(in srgb, #39e2a0 46%, #07111d) 100%)",
      borderColor: "rgba(99,207,168,0.32)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -16px 28px rgba(2,6,12,0.23)",
      color: "#f0f5ff",
    };
  }

  if (value >= 0.05) {
    return {
      background:
        "linear-gradient(135deg, color-mix(in srgb, #63cfa8 50%, #0c1622) 0%, color-mix(in srgb, #39e2a0 38%, #07111d) 100%)",
      borderColor: "rgba(99,207,168,0.26)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.058), inset 0 -16px 28px rgba(2,6,12,0.24)",
      color: "#f0f5ff",
    };
  }

  if (value >= -0.04) {
    return {
      background: "linear-gradient(135deg, #1b2738 0%, #0d1522 100%)",
      borderColor: "rgba(148,163,184,0.2)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.044), inset 0 -14px 26px rgba(2,6,12,0.23)",
      color: "#f0f5ff",
    };
  }

  if (value >= -0.49) {
    return {
      background:
        "linear-gradient(135deg, color-mix(in srgb, #e0556b 32%, #0c1622) 0%, color-mix(in srgb, #e0556b 24%, #0c1622) 100%)",
      borderColor: "rgba(224,85,107,0.24)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -16px 28px rgba(2,6,12,0.24)",
      color: "#f0f5ff",
    };
  }

  if (value >= -0.99) {
    return {
      background:
        "linear-gradient(135deg, color-mix(in srgb, #e0556b 52%, #0c1622) 0%, color-mix(in srgb, #e0556b 38%, #0c1622) 100%)",
      borderColor: "rgba(224,85,107,0.32)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.046), inset 0 -16px 28px rgba(2,6,12,0.24)",
      color: "#f0f5ff",
    };
  }

  return {
    background:
      "linear-gradient(135deg, color-mix(in srgb, #e0556b 70%, #0c1622) 0%, color-mix(in srgb, #e0556b 52%, #0c1622) 100%)",
    borderColor: "rgba(224,85,107,0.42)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.052), inset 0 -16px 28px rgba(2,6,12,0.24), 0 0 16px rgba(224,85,107,0.08)",
    color: "#f0f5ff",
  };
}
