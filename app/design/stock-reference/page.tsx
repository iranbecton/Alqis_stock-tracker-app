"use client";

import Link from "next/link";
import { type CSSProperties, type ReactNode, useState } from "react";
import {
  BarChart3,
  Bell,
  LineChart,
  MoreVertical,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

const quoteTiles = [
  { label: "Latest data", value: "2:55 PM", detail: "Sample delayed" },
  { label: "Open", value: "$306.12", detail: "Session open" },
  { label: "High", value: "$311.40", detail: "Session high" },
  { label: "Low", value: "$305.84", detail: "Session low" },
  { label: "Previous close", value: "$304.99", detail: "Reference close" },
  { label: "Source", value: "Sample feed", detail: "Prototype only" },
];

const stats = [
  ["Market cap", "$2.79T"],
  ["P/E", "28.4"],
  ["Fwd P/E", "26.1"],
  ["EPS", "$6.43"],
  ["Div yield", "0.55%"],
  ["Beta", "1.29"],
  ["52W high", "$199.62"],
  ["Volume", "61.2M"],
];

const evidenceRows = [
  {
    title: "AI infrastructure demand",
    detail:
      "Recent headlines and sector movement align with the sampled move. Contextual evidence supports the read.",
    score: 87,
  },
  {
    title: "Platform services context",
    detail:
      "Recurring revenue language remains part of the sample narrative and helps explain market attention.",
    score: 76,
  },
  {
    title: "Large-cap rotation",
    detail:
      "Peer movement suggests the move may include broader market context, not only company-specific news.",
    score: 68,
  },
];

const challengeRows = [
  {
    title: "News mix is mostly contextual",
    detail: "Some evidence explains backdrop more than a direct company catalyst.",
  },
  {
    title: "Sector pressure can distort the read",
    detail: "Large-cap peer movement may move the stock without being specific to the company.",
  },
  {
    title: "Chart window can change quickly",
    detail: "A shorter chart window may weaken the sampled evidence balance.",
  },
];

const segments = [
  ["iPhone", "$45.96B", "51.5%", "-10.5%", "China weakness driving the decline; watch unit data next quarter."],
  ["Services", "$23.87B", "26.8%", "+14.2%", "Subscriptions, App Store, and AppleCare at 70%+ gross margin."],
  ["Wearables", "$7.91B", "8.9%", "-7.4%", "Watch saturation; AirPods comparisons are tough. Vision Pro sits in this line."],
  ["Mac", "$6.95B", "7.8%", "+3.6%", "M-series cycle holding up; stable but not central."],
  ["iPad", "$4.61B", "5.2%", "-16.8%", "Lowest-share segment; iPad Pro refresh helped briefly."],
];
const segmentColors = ["#4b94ff", "#9d7cff", "#28d28e", "#f0a35e", "#f05d67"];

const historyRows = [
  ["Q2 FY25", "May 1", "$1.53", "$1.50", "$89.3", "$90.6", "Mixed", "-1.2%"],
  ["Q1 FY25", "Jan 30", "$2.40", "$2.36", "$124.3", "$124.7", "Mixed", "-2.4%"],
  ["Q4 FY24", "Oct 31", "$1.64", "$1.60", "$94.9", "$94.4", "Beat", "+1.7%"],
  ["Q3 FY24", "Aug 1", "$1.40", "$1.35", "$85.8", "$84.6", "Beat", "+3.5%"],
  ["Q2 FY24", "May 2", "$1.53", "$1.50", "$90.8", "$90.0", "Beat", "+6.0%"],
  ["Q1 FY24", "Feb 1", "$2.18", "$2.10", "$119.6", "$118.0", "Beat", "-3.4%"],
  ["Q4 FY23", "Nov 2", "$1.46", "$1.39", "$89.5", "$89.3", "Beat", "-0.5%"],
  ["Q3 FY23", "Aug 3", "$1.26", "$1.19", "$81.8", "$81.7", "Beat", "-4.8%"],
];

const navItems = ["Today", "Watchlist", "Portfolio", "Explore", "Alerts", "Learn"];
const contextTabs = ["Overview", "Financials", "Segments", "History", "Business", "Risks"] as const;

type ContextTab = (typeof contextTabs)[number];

const floatingSurface: CSSProperties = {
  background:
    "radial-gradient(ellipse at 82% 0%, rgba(139,132,199,0.12), transparent 42%), radial-gradient(ellipse at 8% 0%, rgba(114,199,190,0.10), transparent 38%), var(--surface-floating)",
  border: "1px solid rgba(128,217,225,0.16)",
  boxShadow: "var(--shadow-floating), var(--highlight-top), 0 0 42px rgba(114,199,190,0.08)",
  transform: "translateY(-2px)",
};

const raisedSurface: CSSProperties = {
  background: "radial-gradient(ellipse at 18% 0%, rgba(114,199,190,0.08), transparent 38%), var(--surface-raised)",
  border: "1px solid rgba(128,217,225,0.10)",
  boxShadow: "0 18px 42px rgba(2,6,12,0.48), inset 0 1px 0 rgba(255,255,255,0.08)",
};

const groundedSurface: CSSProperties = {
  background: "radial-gradient(ellipse at 14% 0%, rgba(128,217,225,0.035), transparent 32%), var(--surface-grounded)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 7px 18px rgba(2,6,12,0.30), inset 0 1px 0 rgba(255,255,255,0.025)",
};

const secondarySurface: CSSProperties = groundedSurface;

const groundedAccent = {
  cyan: "rgba(128,217,225,0.055)",
  blue: "rgba(91,140,255,0.052)",
  violet: "rgba(139,132,199,0.055)",
  green: "rgba(99,207,168,0.052)",
  amber: "rgba(210,169,107,0.052)",
  red: "rgba(201,135,122,0.052)",
};

type GroundedTone = keyof typeof groundedAccent;

const commandSurface: CSSProperties = {
  background:
    "radial-gradient(ellipse at 13% 20%, rgba(114,199,190,0.20), transparent 34%), radial-gradient(ellipse at 38% 58%, rgba(99,207,168,0.10), transparent 38%), radial-gradient(ellipse at 88% 0%, rgba(92,140,255,0.15), transparent 44%), var(--surface-floating)",
  border: "1px solid rgba(128,217,225,0.20)",
  boxShadow: "0 30px 76px rgba(2,6,12,0.66), var(--highlight-top), 0 0 66px rgba(114,199,190,0.13)",
};

const quoteSurface: CSSProperties = {
  ...floatingSurface,
  background:
    "radial-gradient(ellipse at 72% 0%, rgba(114,199,190,0.15), transparent 42%), radial-gradient(ellipse at 14% 0%, rgba(92,140,255,0.11), transparent 38%), var(--surface-floating)",
  border: "1px solid rgba(128,217,225,0.20)",
  boxShadow: "var(--shadow-floating), var(--highlight-top), 0 0 48px rgba(114,199,190,0.10)",
};

const chartSurface: CSSProperties = {
  ...raisedSurface,
  background:
    "radial-gradient(ellipse at 68% 18%, rgba(99,207,168,0.12), transparent 36%), radial-gradient(ellipse at 88% 0%, rgba(77,148,255,0.12), transparent 40%), var(--surface-raised)",
  border: "1px solid rgba(128,217,225,0.14)",
  boxShadow: "0 22px 58px rgba(2,6,12,0.58), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 42px rgba(99,207,168,0.08)",
};

const readSurface: CSSProperties = {
  ...floatingSurface,
  background:
    "radial-gradient(ellipse at 0% 0%, rgba(114,199,190,0.14), transparent 32%), radial-gradient(ellipse at 92% 12%, rgba(139,132,199,0.20), transparent 36%), var(--surface-floating)",
  border: "1px solid rgba(139,132,199,0.32)",
  borderTop: "2px solid #8b84c7",
  boxShadow:
    "var(--shadow-floating), var(--highlight-top), 0 -4px 28px rgba(139,132,199,0.28), 0 0 54px rgba(114,199,190,0.10), 0 0 0 1px rgba(139,132,199,0.16)",
};

export default function StockReferenceDesignPage() {
  const [activeTab, setActiveTab] = useState<ContextTab>("Overview");

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#03070d] text-[#e8eef8]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_5%,rgba(34,108,190,0.24),transparent_30rem),radial-gradient(circle_at_50%_28%,rgba(84,96,255,0.13),transparent_38rem),radial-gradient(circle_at_76%_35%,rgba(49,204,190,0.20),transparent_30rem),linear-gradient(180deg,#040810_0%,#07101a_42%,#02050a_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_14%,rgba(0,0,0,0.58)_100%)]" />
      <div className="pointer-events-none fixed left-1/2 top-[6.5rem] h-[50rem] w-[96rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(54,149,255,0.22),rgba(54,149,255,0.09)_34%,transparent_68%)] blur-2xl" />
      <div className="pointer-events-none fixed left-[64%] top-[27rem] h-[36rem] w-[44rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(131,100,255,0.16),transparent_68%)] blur-2xl" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(107,146,191,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(107,146,191,0.014)_1px,transparent_1px)] bg-[size:76px_76px] opacity-35 [mask-image:linear-gradient(180deg,#000,transparent_82%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.022] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0.8px,transparent_0.8px)] [background-size:7px_7px]" />

      <div className="relative z-10">
        <TopRail />

        <section className="mx-auto w-full max-w-[116rem] px-3 pb-12 pt-1.5 sm:px-5 2xl:px-8">
          <PrototypeLabel />
          <StockCommandHeader />
          <ContextRail activeTab={activeTab} onTabChange={setActiveTab} />
          <TabContent activeTab={activeTab} />
          <PrototypeDisclaimer />
        </section>
      </div>
    </main>
  );
}

function TopRail() {
  return (
    <header className="border-b border-[#244a70]/85 bg-[linear-gradient(180deg,rgba(6,13,23,0.96),rgba(3,7,13,0.90))] shadow-[0_14px_44px_rgba(0,0,0,0.46),inset_0_-1px_0_rgba(128,217,225,0.08)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-[116rem] gap-2 px-3 py-1.5 sm:px-5 2xl:px-8 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-fit items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-md border border-[#7a96ff]/35 bg-[linear-gradient(135deg,#6b86ff,#243a7a)] text-[0.7rem] font-black text-white shadow-[0_0_30px_rgba(88,119,255,0.48)]">
            A
          </div>
          <div className="border-l border-[#244464] pl-2.5">
            <p className="text-sm font-black tracking-tight text-white">ALQIS</p>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#587499]">
              Vol. 1 / Stock workspace
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-center">
          <nav className="scrollbar-hide flex gap-1.5 overflow-x-auto" aria-label="Prototype navigation">
            {navItems.map((item) => (
              <Link
                href={item === "Learn" ? "/learn" : "/dashboard"}
                key={item}
                className={`rounded-md px-2.5 py-1.5 text-[0.72rem] font-bold ${
                  item === "Explore"
                    ? "bg-[#102e55] text-[#e5f1ff] shadow-[inset_0_0_0_1px_rgba(111,176,255,0.16)]"
                    : "text-[#8298b4] hover:bg-[#0c1b30] hover:text-[#dcecff]"
                }`}
              >
                {item}
              </Link>
            ))}
          </nav>
          <div className="hidden min-w-[34rem] items-center gap-2 rounded-md border border-[#2d527b] bg-[linear-gradient(180deg,#0b1b2c,#060d18)] px-3 py-1.5 text-xs text-[#9bb0c9] shadow-[0_8px_28px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(128,217,225,0.10)] lg:flex">
            <Search className="h-3.5 w-3.5" />
            Search a ticker, ask what changed...
            <span className="ml-auto rounded border border-[#2a486d] px-1.5 text-[0.62rem] text-[#7c91ac]">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-self-start lg:justify-self-end">
          <div className="hidden items-center gap-2 rounded-md border border-[#2a4f75] bg-[linear-gradient(180deg,#0b1b2c,#050c16)] px-2.5 py-1.5 text-[0.68rem] font-bold text-[#dcecff] shadow-[inset_0_1px_0_rgba(128,217,225,0.08)] md:flex">
            <span className="text-[#6d84a4]">TODAY</span>
            <span className="text-[#43d596]">+1.52%</span>
          </div>
          <button className="rounded-sm border border-[#2d6bb7]/80 bg-[linear-gradient(180deg,#0c2036,#07111f)] px-3 py-1.5 text-xs font-bold text-[#8fc5ff] shadow-[0_0_22px_rgba(45,107,183,0.22),inset_0_1px_0_rgba(128,217,225,0.10)]">
            Get ALQIS Read
          </button>
          <div className="grid h-8 w-8 place-items-center rounded-full border border-[#597cff]/50 bg-[#283a78] text-xs font-bold">
            A
          </div>
        </div>
      </div>
    </header>
  );
}

function PrototypeLabel() {
  return (
    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 border border-[#2d527b]/70 bg-[linear-gradient(90deg,rgba(9,28,47,0.94),rgba(6,16,28,0.76))] px-3 py-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(128,217,225,0.08)] backdrop-blur-sm">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#80d9e1]">
        Visual prototype — sample data
      </p>
      <p className="text-xs text-[#7f93ad]">
        Static mockup for layout review. Not connected to live market data.
      </p>
    </div>
  );
}

function StockCommandHeader() {
  return (
    <section
      className="relative overflow-hidden border border-[#47739f]/70 bg-[radial-gradient(circle_at_14%_28%,rgba(128,217,225,0.25),transparent_17rem),radial-gradient(circle_at_34%_54%,rgba(71,209,198,0.17),transparent_18rem),radial-gradient(circle_at_87%_18%,rgba(72,144,255,0.21),transparent_22rem),linear-gradient(145deg,#132d48,#071322_48%,#050b14_100%)] p-3 shadow-[0_38px_120px_rgba(0,0,0,0.66),0_0_100px_rgba(47,128,200,0.18),inset_0_1px_0_rgba(220,244,255,0.22),inset_0_-32px_78px_rgba(3,7,13,0.46)] xl:grid xl:grid-cols-[minmax(0,1fr)_30rem] xl:gap-0"
      style={commandSurface}
    >
      <div className="pointer-events-none absolute -left-24 top-2 h-44 w-80 rounded-full bg-[#7bdcd5]/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-12 h-32 w-96 rounded-full bg-[#4d86ff]/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-10 left-20 h-24 w-[54rem] rotate-[-5deg] bg-[linear-gradient(90deg,transparent,rgba(178,231,255,0.13),transparent)] blur-xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b9e8ff]/82 to-transparent" />
      <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[#3f75a6]/80 to-transparent" />
      <div className="min-w-0 xl:border-r xl:border-[#315a83]/55 xl:pr-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-[#5380ad] bg-[linear-gradient(145deg,#244a74,#0b1727)] text-base font-black text-white shadow-[0_0_42px_rgba(78,147,227,0.34),inset_0_1px_0_rgba(190,233,255,0.14)]">
              AA
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-serif text-[3.55rem] font-semibold leading-none tracking-[-0.04em] text-[#f2f6ff] sm:text-[4.35rem]">AAPL</h1>
                <span className="rounded border border-[#24456f] bg-[#07111f] px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.16em] text-[#86a7cf]">
                  Nasdaq NMS
                </span>
                <span className="rounded border border-[#8b84c7] bg-[color-mix(in_srgb,#8b84c7_18%,transparent)] px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#8b84c7] shadow-[0_0_18px_rgba(139,132,199,0.14)]">
                  ALQIS read active
                </span>
                <span className="rounded border border-[#d2a96b]/70 bg-[color-mix(in_srgb,#d2a96b_14%,transparent)] px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#d2a96b]">
                  Sample delayed
                </span>
              </div>
              <p className="mt-1 text-base font-semibold text-[#aebfd5]">Apple Inc. / Consumer platforms</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[linear-gradient(135deg,#8ee8df,#58c3bd)] px-4 text-xs font-black text-[#031318] shadow-[0_0_26px_rgba(115,210,201,0.22)]">
              <Sparkles className="h-3.5 w-3.5" />
              Save to Watchlist
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-md border border-[#2a4a71] bg-[#07111f] text-[#b8c8df]">
              <Bell className="h-3.5 w-3.5" />
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-md border border-[#2a4a71] bg-[#07111f] text-[#b8c8df]">
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative">
            <span className="pointer-events-none absolute -left-10 top-5 h-28 w-96 bg-[radial-gradient(ellipse_at_center,rgba(128,217,225,0.18),transparent_70%)] blur-2xl" />
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#6f8cb0]">Current price</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-4">
              <p className="font-serif text-[5.1rem] font-semibold leading-none tracking-[-0.045em] text-[#f5f8ff] sm:text-[6.3rem]" data-numeric>
                $308.82
              </p>
              <p className="text-2xl font-bold text-[#63cfa8] drop-shadow-[0_0_16px_rgba(99,207,168,0.26)]" style={{ color: "#63cfa8", fontWeight: 700, fontSize: "1.35rem" }} data-numeric>
                <span style={{ color: "#63cfa8" }}>▲</span> +3.83 / +1.26%
              </p>
              <span className="rounded-full border border-[#236a64] bg-[#0b2b2b] px-2.5 py-1 text-[0.68rem] font-black text-[#88ded8]">
                Sample quote data
              </span>
            </div>
            <p className="mt-2 text-sm text-[#8fa4bf]" data-numeric>
              Open $306.12 / Previous $304.99
            </p>
          </div>
          <div className="max-w-3xl border-l border-[#5aa6d6] bg-[linear-gradient(90deg,rgba(13,39,64,0.92),rgba(7,20,35,0.52))] px-3 py-2 shadow-[0_12px_26px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(128,217,225,0.10)]">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#7ca6cc]">Market context</p>
            <p className="mt-1 text-[0.88rem] font-medium leading-6 text-[#b7c8dc]">
              Sample narrative: AI infrastructure and platform-services context appear tied to the move.
            </p>
          </div>
        </div>
      </div>

      <div
        className="relative mt-3 overflow-hidden border border-[#47739f]/48 bg-[#244b70]/54 shadow-[0_30px_78px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(180,224,255,0.14),inset_0_-26px_58px_rgba(3,7,13,0.36)] xl:mt-0 xl:border-l-0"
        style={quoteSurface}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(128,217,225,0.16),transparent_16rem)]" />
        <div className="relative flex items-center justify-between border-b border-[#35618d]/55 bg-[linear-gradient(180deg,#10263e,#081523)] px-3 py-2">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#8eb8d8]">Quote panel</p>
          <p className="text-[0.66rem] font-bold text-[#78d9d1]">Sample feed</p>
        </div>
        <div className="relative grid grid-cols-2 gap-[1px] bg-[#2d527b]/24">
          {quoteTiles.map((tile) => (
            <div key={tile.label} className="min-h-[4.8rem] bg-[radial-gradient(circle_at_100%_0%,rgba(128,217,225,0.07),transparent_7rem),linear-gradient(180deg,rgba(16,34,56,0.96),rgba(7,17,31,0.92))] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(128,217,225,0.08),inset_0_-14px_28px_rgba(3,7,13,0.24)] transition-colors hover:bg-[#10253d]">
              <p className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-[#7b95b6]">{tile.label}</p>
              <p className="mt-1 truncate text-base font-black text-[#edf5ff]" data-numeric>
                {tile.value}
              </p>
              <p className="mt-0.5 truncate text-[0.72rem] text-[#8da3bd]">{tile.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MainWorkstation() {
  return (
    <section className="mt-2 grid gap-3 xl:grid-cols-[minmax(0,1.48fr)_minmax(27rem,0.72fr)]">
      <ChartPanel />
      <ReadPanel />
    </section>
  );
}

function ChartPanel() {
  return (
    <section
      className="relative overflow-hidden border border-[#47739f]/72 bg-[#07111f]/94 shadow-[0_0_0_1px_rgba(128,217,225,0.06),0_38px_105px_rgba(0,0,0,0.58),0_0_105px_rgba(49,204,190,0.11),inset_0_-34px_80px_rgba(3,7,13,0.34)]"
      style={chartSurface}
    >
      <div className="pointer-events-none absolute -left-20 top-10 h-56 w-80 rounded-full bg-[#42d694]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-16 h-56 w-80 rounded-full bg-[#4b94ff]/14 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#9adfff]/60 to-transparent" />
      <div className="relative flex flex-wrap items-start justify-between gap-2 border-b border-[#35618d]/68 bg-[linear-gradient(180deg,#122a43,#081421)] px-4 py-3 shadow-[inset_0_1px_0_rgba(180,224,255,0.12),0_14px_34px_rgba(0,0,0,0.18)]">
        <div>
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-[#82ddd7]" />
            <h2 className="text-base font-black text-[#f0f6ff]">Proof of move</h2>
          </div>
          <p className="mt-0.5 text-[0.82rem] text-[#9fb3cb]">Price action shown with sampled evidence pins.</p>
        </div>
        <div className="flex items-center gap-1.5">
          {["1D", "5D", "1M", "3M", "1Y"].map((range) => (
            <button
              key={range}
              className={`rounded border px-2 py-1 text-[0.66rem] font-semibold shadow-[inset_0_1px_0_rgba(128,217,225,0.06)] ${
                range === "1Y"
                  ? "border-[#72c7be] bg-[#72c7be] text-[#070f14] shadow-[0_0_18px_rgba(114,199,190,0.24)]"
                  : "border-[rgba(114,199,190,0.35)] bg-transparent text-[#afb7be]"
              }`}
              style={
                range === "1Y"
                  ? { backgroundColor: "#72c7be", color: "#070f14", fontWeight: 600 }
                  : { backgroundColor: "transparent", border: "1px solid rgba(114,199,190,0.35)", color: "#afb7be" }
              }
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[35rem] overflow-hidden bg-[radial-gradient(ellipse_at_72%_35%,rgba(99,207,168,0.18),transparent_40%),radial-gradient(circle_at_66%_18%,rgba(80,192,255,0.36),transparent_26rem),radial-gradient(circle_at_44%_56%,rgba(45,216,155,0.30),transparent_24rem),radial-gradient(circle_at_8%_12%,rgba(98,92,255,0.12),transparent_20rem),linear-gradient(180deg,#102b45,#06101c)] p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_32%,rgba(0,0,0,0.28)_100%)]" />
        <div className="absolute inset-x-6 bottom-0 h-28 bg-gradient-to-t from-[#06101c] via-[#06101c]/70 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(121,184,239,0.024)_1px,transparent_1px),linear-gradient(90deg,rgba(121,184,239,0.018)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,#000_0%,#000_48%,transparent_86%)]" />
        <div className="absolute inset-x-5 top-9 h-px bg-[#2b527d]/55" />
        <div className="absolute inset-x-5 top-[42%] h-px border-t border-dashed border-[#24466f]/50" />
        <div className="absolute inset-x-5 bottom-16 h-px border-t border-dashed border-[#24466f]/45" />
        <svg viewBox="0 0 920 320" className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]">
          <defs>
            <linearGradient id="prototypeLine" x1="0" x2="1">
              <stop offset="0%" stopColor="#2fdc8d" />
              <stop offset="54%" stopColor="#35c8c5" />
              <stop offset="100%" stopColor="#7fc8ff" />
            </linearGradient>
            <linearGradient id="prototypeFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#32d494" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#07111f" stopOpacity="0" />
            </linearGradient>
            <filter id="prototypeGlow" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="pinGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M22 271 C82 250 128 247 174 235 C228 220 260 214 302 188 C350 154 382 112 430 118 C468 124 484 154 528 149 C574 144 606 121 646 131 C690 141 720 165 760 152 C798 140 832 132 894 150 L894 300 L22 300 Z"
            fill="url(#prototypeFill)"
          />
          <path
            d="M22 271 C82 250 128 247 174 235 C228 220 260 214 302 188 C350 154 382 112 430 118 C468 124 484 154 528 149 C574 144 606 121 646 131 C690 141 720 165 760 152 C798 140 832 132 894 150"
            fill="none"
            stroke="#2cd89b"
            strokeLinecap="round"
            strokeOpacity="0.34"
            strokeWidth="22"
            filter="url(#prototypeGlow)"
          />
          <path
            d="M22 271 C82 250 128 247 174 235 C228 220 260 214 302 188 C350 154 382 112 430 118 C468 124 484 154 528 149 C574 144 606 121 646 131 C690 141 720 165 760 152 C798 140 832 132 894 150"
            fill="none"
            stroke="#9ff5e9"
            strokeLinecap="round"
            strokeOpacity="0.16"
            strokeWidth="10"
          />
          <path
            d="M22 271 C82 250 128 247 174 235 C228 220 260 214 302 188 C350 154 382 112 430 118 C468 124 484 154 528 149 C574 144 606 121 646 131 C690 141 720 165 760 152 C798 140 832 132 894 150"
            fill="none"
            stroke="url(#prototypeLine)"
            strokeLinecap="round"
            strokeWidth="6"
          />
          {[302, 430, 646, 760, 894].map((x, index) => {
            const pinColor = ["#7da6d9", "#d2a96b", "#8b84c7", "#7da6d9", "#8b84c7"][index];
            const pinY = [188, 118, 131, 152, 150][index];

            return (
            <g key={x}>
              <line x1={x} x2={x} y1="44" y2="300" stroke="#375b86" strokeDasharray="4 6" opacity="0.36" />
              <circle cx={x} cy={pinY} r="18" fill={pinColor} opacity="0.17" filter="url(#pinGlow)" />
              <circle cx={x} cy={pinY} r="10" fill="#07111f" stroke={pinColor} strokeWidth="4" filter="url(#pinGlow)" />
              <circle cx={x} cy={pinY} r="3" fill={pinColor} />
              <rect x={x - 22} y={pinY - 34} width="44" height="16" rx="3" fill="#07111f" stroke={pinColor} opacity="0.9" />
              <text x={x} y={pinY - 22} fill="#d9e5f0" fontSize="10" fontWeight="700" textAnchor="middle">
                E{index + 1}
              </text>
            </g>
            );
          })}
        </svg>
        <div className="absolute left-4 top-3 flex gap-2 text-[0.68rem] font-bold text-[#b8cbe2] [&>span]:rounded [&>span]:border [&>span]:border-[#2a517d] [&>span]:bg-[#102033]/88 [&>span]:px-2 [&>span]:py-1 [&>span]:shadow-[0_8px_22px_rgba(0,0,0,0.20)]">
          <span className="!border-[#7da6d9]/50 !text-[#7da6d9]">● News</span>
          <span className="!border-[#d2a96b]/50 !text-[#d2a96b]">● Earnings</span>
          <span className="!border-[#8b84c7]/50 !text-[#8b84c7]">✦ AI insight</span>
        </div>
        <p className="absolute bottom-4 left-4 right-4 border-t border-[#315a83] bg-[#06101c]/35 pt-3 text-[0.82rem] text-[#b1c5dc] backdrop-blur-sm">
          Click a marker to inspect sampled evidence context.
        </p>
      </div>
    </section>
  );
}

function ReadPanel() {
  return (
    <aside
      className="relative overflow-hidden border border-t-2 border-[#8bbfea]/68 border-t-[#8b84c7] bg-[radial-gradient(circle_at_0%_0%,rgba(72,144,255,0.50),transparent_20rem),radial-gradient(circle_at_88%_68%,rgba(113,99,255,0.30),transparent_19rem),radial-gradient(circle_at_60%_15%,rgba(128,217,225,0.15),transparent_15rem),linear-gradient(150deg,#1e456f,#0a1727_58%,#07101b)] shadow-[0_-4px_24px_rgba(139,132,199,0.18),0_0_120px_rgba(65,128,216,0.42),0_46px_105px_rgba(0,0,0,0.54),inset_0_1px_0_rgba(210,238,255,0.18),inset_0_-38px_84px_rgba(3,7,13,0.38)] xl:-translate-y-0.5"
      style={readSurface}
    >
      <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-[#8364ff]/14 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-8 h-44 w-56 rounded-full bg-[#80d9e1]/12 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 top-0 h-40 w-[34rem] rotate-[-8deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)] blur-xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b9e8ff]/75 to-transparent" />
      <div className="relative border-b border-[#376590]/70 bg-[linear-gradient(180deg,rgba(18,42,67,0.92),rgba(10,25,43,0.74))] px-4 py-3 shadow-[inset_0_1px_0_rgba(210,238,255,0.12),0_12px_32px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#88ded8]">
            <Sparkles className="h-3.5 w-3.5" />
            ALQIS Read
          </p>
          <span className="rounded-full border border-[#486f99] bg-[#0c1b2d]/80 px-2 py-1 text-[0.62rem] font-bold text-[#aec3dc] shadow-[inset_0_1px_0_rgba(128,217,225,0.08)]">
            Updated 14m ago
          </span>
        </div>
      </div>
      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-2 sm:grid-cols-[auto_auto_1fr] sm:items-center">
          <span className="rounded border border-[#72c7be]/50 bg-[color-mix(in_srgb,#72c7be_16%,transparent)] px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#72c7be] shadow-[0_0_18px_rgba(114,199,190,0.10)]">
            10 sources
          </span>
          <span
            className="text-xs font-semibold tracking-wide px-3 py-1 rounded-full border"
            style={{ backgroundColor: "rgba(139, 132, 199, 0.24)", borderColor: "#8b84c7", color: "#8b84c7", boxShadow: "0 0 14px rgba(139, 132, 199, 0.28)" }}
          >
            Moderate confidence
          </span>
          <div className="h-2 overflow-hidden border border-[#25486f] bg-[#0a1b2d] shadow-[inset_0_1px_4px_rgba(0,0,0,0.38)]">
            <div className="h-full w-[72%] bg-gradient-to-r from-[#6f7cff] via-[#82ddd7] to-[#42d694] shadow-[0_0_20px_rgba(128,217,225,0.36)]" />
          </div>
        </div>
        <div className="relative overflow-hidden border border-[#47739f]/58 bg-[radial-gradient(circle_at_0%_0%,rgba(128,217,225,0.20),transparent_13rem),radial-gradient(circle_at_100%_20%,rgba(131,100,255,0.17),transparent_12rem),linear-gradient(180deg,#132f4d,#091421)] p-3 shadow-[inset_0_1px_0_rgba(180,224,255,0.14),inset_0_-20px_40px_rgba(3,7,13,0.24),0_26px_52px_rgba(0,0,0,0.34)]">
          <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#d8f5ff]/55 to-transparent" />
          <h2 className="font-serif text-[2.22rem] leading-[1.08] text-[#fff3e0] 2xl:text-[2.55rem]">
            AAPL is moving higher as <span className="text-[#72c7be]">AI infrastructure demand</span> and{" "}
            <span className="text-[#8b84c7]">services context</span> shape the read.
          </h2>
          <p className="mt-3 text-[0.95rem] leading-6 text-[#d1ddec]">
            This prototype keeps explanation first: the chart and evidence modules support the read, while data tables stay compact below.
          </p>
        </div>
        <div className="grid gap-2">
          {["AI demand aligns with the sample move", "Services context supports the narrative", "Sector movement adds market context"].map((item, index) => (
            <div key={item} className="grid grid-cols-[1.8rem_minmax(0,1fr)] gap-2 border border-[#47739f]/45 bg-[radial-gradient(circle_at_100%_0%,rgba(128,217,225,0.11),transparent_9rem),linear-gradient(180deg,#122d49,#091421)] px-3 py-3 shadow-[inset_3px_0_0_rgba(128,217,225,0.42),inset_0_1px_0_rgba(180,224,255,0.08),inset_0_-14px_28px_rgba(3,7,13,0.19),0_16px_32px_rgba(0,0,0,0.26)]">
              <span
                className="mt-1.5 h-2.5 w-2.5 rounded-full shadow-[0_0_12px_currentColor]"
                style={{ backgroundColor: ["#63cfa8", "#72c7be", "#7da6d9"][index], color: ["#63cfa8", "#72c7be", "#7da6d9"][index] }}
              />
              <p className="text-[0.82rem] font-semibold leading-5 text-[#e1ebf8]">{item}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="border border-[#23836f]/40 border-l-2 border-l-[#63cfa8] bg-[color-mix(in_srgb,#63cfa8_10%,#0d151d)] px-3 py-3 shadow-[inset_0_1px_0_rgba(99,207,168,0.14),inset_0_-16px_32px_rgba(3,7,13,0.22),0_16px_34px_rgba(0,0,0,0.24)]">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#63cfa8]">Supports read</p>
            <p className="mt-1 text-[0.8rem] leading-5 text-[#c2d0e0]">Evidence aligns with the sample move.</p>
          </div>
          <div className="border border-[#8b4c42]/40 border-l-2 border-l-[#c9877a] bg-[color-mix(in_srgb,#c9877a_10%,#0d151d)] px-3 py-3 shadow-[inset_0_1px_0_rgba(201,135,122,0.14),inset_0_-16px_32px_rgba(3,7,13,0.22),0_16px_34px_rgba(0,0,0,0.24)]">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#c9877a]">Challenges read</p>
            <p className="mt-1 text-[0.8rem] leading-5 text-[#c2d0e0]">Some context may be broad-market driven.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Compare to peers →", "Explain top driver →", "What would change this →"].map((label) => (
            <button
              key={label}
              className="rounded-full border border-[rgba(114,199,190,0.3)] bg-transparent px-3 py-1 text-[0.72rem] font-bold text-[#72c7be] transition-colors hover:bg-[color-mix(in_srgb,#72c7be_12%,transparent)]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function StatStrip() {
  return (
    <section
      className="mt-2 grid grid-cols-2 gap-px border border-[#35618d]/65 bg-[#2b5277]/50 shadow-[0_24px_66px_rgba(0,0,0,0.38),0_0_42px_rgba(49,204,190,0.06),inset_0_1px_0_rgba(128,217,225,0.10)] sm:grid-cols-4 xl:grid-cols-8"
      style={secondarySurface}
    >
      {stats.map(([label, value]) => {
        const valueColor = label === "52W high" ? "text-[#63cfa8]" : label === "Beta" ? "text-[#d2a96b]" : "text-[#f4eee2]";

        return (
          <div key={label} className="relative overflow-hidden bg-[radial-gradient(circle_at_100%_0%,rgba(128,217,225,0.08),transparent_7rem),linear-gradient(180deg,#102238,#091523)] px-3 py-2.5 shadow-[inset_0_-12px_24px_rgba(3,7,13,0.18)] transition-colors hover:bg-[#10253d]">
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#80d9e1]/45 to-transparent" />
            <p className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-[#77828d]">{label}</p>
            <p className={`mt-0.5 text-sm font-black ${valueColor}`} data-numeric>
              {value}
            </p>
          </div>
        );
      })}
    </section>
  );
}

function EvidenceGrid() {
  return (
    <section className="mt-2 grid gap-3 xl:grid-cols-[minmax(0,1.18fr)_minmax(24rem,0.82fr)]">
      <div
        className="border border-[#3c6794]/65 bg-[radial-gradient(circle_at_20%_0%,rgba(50,127,255,0.17),transparent_20rem),linear-gradient(180deg,#0d1d30,#07111f)] shadow-[0_28px_76px_rgba(0,0,0,0.40),inset_0_1px_0_rgba(128,217,225,0.08),inset_0_-30px_60px_rgba(3,7,13,0.22)]"
        style={secondarySurface}
      >
        <HeaderKicker label="Why AAPL moved today" right="87% confidence" />
        <div className="divide-y divide-[#2d527b]">
          {evidenceRows.map((row, index) => (
            <EvidenceLine key={row.title} index={index + 1} {...row} />
          ))}
        </div>
      </div>
      <div
        className="border border-[#3c6794]/65 bg-[radial-gradient(circle_at_100%_0%,rgba(240,163,94,0.14),transparent_18rem),linear-gradient(180deg,#0d1d30,#081421)] shadow-[0_28px_76px_rgba(0,0,0,0.40),inset_0_1px_0_rgba(128,217,225,0.08),inset_0_-30px_60px_rgba(3,7,13,0.22)]"
        style={secondarySurface}
      >
        <HeaderKicker label="Challenges read" right="Evidence balance" />
        <div className="divide-y divide-[#2d527b]">
          {challengeRows.map((row, index) => (
            <div key={row.title} className="group relative bg-[linear-gradient(180deg,rgba(13,29,47,0.42),rgba(8,20,33,0.18))] px-3 py-3 transition-colors hover:bg-[#10233a]">
              <span className="absolute left-0 top-3 h-7 w-1 bg-[#f0a35e]/80 opacity-70" />
              <p className="text-sm font-black text-[#f0f6ff]">{row.title}</p>
              <p className="mt-1 text-[0.82rem] leading-5 text-[#9fb3cb]">{row.detail}</p>
              <div className="mt-2 h-1.5 overflow-hidden bg-[#172740] shadow-[inset_0_1px_3px_rgba(0,0,0,0.36)]">
                <div className="h-full bg-[#f0a35e] shadow-[0_0_16px_rgba(240,163,94,0.28)]" style={{ width: `${62 - index * 12}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EvidenceLine({
  index,
  title,
  detail,
  score,
}: {
  index: number;
  title: string;
  detail: string;
  score: number;
}) {
  return (
    <div className="grid gap-3 bg-[linear-gradient(180deg,rgba(13,29,47,0.46),rgba(8,20,33,0.18))] px-3 py-3.5 transition-colors hover:bg-[#10233a] md:grid-cols-[2.5rem_minmax(0,1fr)_8rem] md:items-center">
      <span className="grid h-7 w-7 place-items-center border border-[#2d6981] bg-[#0b2231] text-xs font-black text-[#80d9e1] shadow-[0_0_18px_rgba(128,217,225,0.12)]">0{index}</span>
      <div>
        <p className="text-sm font-black text-[#f0f6ff]">{title}</p>
        <p className="mt-1 text-[0.82rem] leading-5 text-[#9fb3cb]">{detail}</p>
      </div>
      <div>
        <p className="text-right text-xs font-black text-[#dce8f8]" data-numeric>
          {score}%
        </p>
        <div className="mt-1 h-1.5 overflow-hidden bg-[#172740] shadow-[inset_0_1px_3px_rgba(0,0,0,0.36)]">
          <div className="h-full bg-[#80d9e1] shadow-[0_0_16px_rgba(128,217,225,0.32)]" style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

function ContextRail({
  activeTab,
  onTabChange,
}: {
  activeTab: ContextTab;
  onTabChange: (tab: ContextTab) => void;
}) {
  return (
    <section className="mt-2 border-b border-[#35618d]/65 bg-transparent">
      <div className="scrollbar-dark flex gap-4 overflow-x-auto">
        {contextTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`relative min-w-fit border-b-2 px-3.5 py-2 text-left text-[0.78rem] transition ${
              activeTab === tab
                ? "border-[#72c7be] bg-[linear-gradient(180deg,rgba(114,199,190,0.13),rgba(114,199,190,0.025))] font-semibold text-[#f4eee2] shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_0_18px_rgba(114,199,190,0.12)]"
                : "border-transparent font-semibold text-[#77828d] hover:bg-[rgba(114,199,190,0.035)] hover:text-[#afb7be]"
            }`}
          >
            {activeTab === tab ? (
              <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-[#b5fff8] to-transparent" />
            ) : null}
            {tab}
          </button>
        ))}
      </div>
    </section>
  );
}

function TabContent({ activeTab }: { activeTab: ContextTab }) {
  if (activeTab === "Overview") {
    return (
      <>
        <MainWorkstation />
        <StatStrip />
        <EvidenceGrid />
      </>
    );
  }

  if (activeTab === "Financials") {
    return <FinancialsPanel />;
  }

  if (activeTab === "Segments") {
    return (
      <section className="mt-2">
        <SegmentPanel />
      </section>
    );
  }

  if (activeTab === "History") {
    return (
      <section className="mt-2">
        <HistoryPanel />
      </section>
    );
  }

  if (activeTab === "Business") {
    return (
      <section className="mt-2">
        <BusinessPanel />
      </section>
    );
  }

  return <RisksPanel />;
}

function FinancialsPanel() {
  const capitalReturn = [
    { year: "FY20", repurchases: 72, dividends: 14 },
    { year: "FY21", repurchases: 86, dividends: 14.5 },
    { year: "FY22", repurchases: 89, dividends: 14.8 },
    { year: "FY23", repurchases: 78, dividends: 15 },
    { year: "FY24", repurchases: 95, dividends: 15.3 },
  ];
  const maxCapitalReturn = Math.max(...capitalReturn.map((bar) => bar.repurchases + bar.dividends));

  return (
    <section className="mt-2 space-y-4">
      <TabSummaryBanner>
        Apple has returned roughly <Highlight tone="warn">$700B</Highlight> to shareholders since 2012, one of the largest capital-return programs on record. The current ~$110B annual run-rate is about <Highlight tone="gain">4% of market cap</Highlight> in repurchase yield, which can support EPS even when revenue growth slows.
      </TabSummaryBanner>
      <div className="hidden">
        {stats.slice(0, 4).map(([label, value]) => (
          <div key={label} className="bg-[linear-gradient(180deg,#112640,#091523)] p-3.5">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#7b95b6]">{label}</p>
            <p className="mt-1 text-lg font-black text-[#edf5ff]" data-numeric>
              {value}
            </p>
            <p className="mt-1 text-[0.8rem] leading-5 text-[#a3b6ce]">Visual prototype — sample data.</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <ResearchPanel tone="blue">
          <PanelTitle title="Annual capital return ($B)" />
          <div className="mt-10 flex h-52 items-end gap-3 border-b border-[var(--border)] px-2">
            {capitalReturn.map((bar) => (
              <div key={bar.year} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full max-w-36 items-end">
                  <div
                    className="flex w-full flex-col overflow-hidden rounded-t-md bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] shadow-[0_18px_30px_rgba(0,0,0,0.25)]"
                    style={{ height: `${((bar.repurchases + bar.dividends) / maxCapitalReturn) * 100}%` }}
                  >
                    <div style={{ height: `${(bar.dividends / (bar.repurchases + bar.dividends)) * 100}%`, background: "var(--accent-ai)" }} />
                    <div style={{ height: `${(bar.repurchases / (bar.repurchases + bar.dividends)) * 100}%`, background: "var(--info)" }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-[var(--text-muted)]">{bar.year}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-5 text-xs text-[var(--text-secondary)]">
            <LegendDot color="var(--info)" label="Repurchases" />
            <LegendDot color="var(--accent-ai)" label="Dividends" />
          </div>
        </ResearchPanel>

        <ResearchPanel tone="violet">
          <PanelTitle title="Cash & return snapshot" />
          <div className="mt-5 divide-y divide-[var(--border)]">
            {[
              ["Cash & equivalents", "$67.2B"],
              ["Total debt", "$104.6B"],
              ["Dividend per share", "$1.00/yr"],
              ["Forward repurchase authorization", "$110B"],
              ["Shares retired (5y)", "-13.4%"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="font-medium text-[var(--text-secondary)]">{label}</span>
                <span className="font-black text-[var(--text-primary)]" data-numeric>{value}</span>
              </div>
            ))}
          </div>
        </ResearchPanel>
      </div>

      <TabSummaryBanner>
        AAPL currently trades at a <Highlight tone="warn">15-35% premium to its own 5-year average</Highlight> across most multiples, while <Highlight tone="loss">revenue growth has decelerated</Highlight>. Trailing P/E is about 28x. The <Highlight tone="info">Services revenue mix</Highlight> is one factor often referenced when comparing multiples across the sector.
      </TabSummaryBanner>

      <ValuationTable />
    </section>
  );
}

function RisksPanel() {
  const riskRows = [
    ["#1", "China demand erosion", 78, "High & ongoing", "var(--loss)", true],
    ["#2", "App Store regulation", 70, "High & escalating", "var(--loss)", false],
    ["#3", "AI strategy lag", 50, "Medium · narrative", "var(--warn)", false],
    ["#4", "Valuation compression", 45, "Medium · sentiment-driven", "var(--warn)", false],
    ["#5", "Vision Pro / hardware miss", 26, "Lower · small line", "var(--info)", false],
  ] as const;

  return (
    <section className="mt-2 space-y-4">
      <TabSummaryBanner>
        Two risks dominate current AAPL coverage: <Highlight tone="loss">China demand</Highlight> and <Highlight tone="loss">App Store regulation</Highlight>. Both are active and quantifiable. Other factors (AI lag, <Highlight tone="warn">valuation</Highlight>, Vision Pro) are more secondary or narrative-driven at this stage.
      </TabSummaryBanner>

      <div className="hidden">
        {challengeRows.map((row, index) => (
          <div key={row.title} className="grid gap-3 bg-[linear-gradient(180deg,rgba(13,29,47,0.46),rgba(8,20,33,0.18))] px-3 py-3.5 transition-colors hover:bg-[#10233a] md:grid-cols-[2.5rem_minmax(0,1fr)_8rem] md:items-center">
            <span className="grid h-7 w-7 place-items-center border border-[#8b5d48] bg-[#261a17] text-xs font-black text-[#f0a35e] shadow-[0_0_18px_rgba(240,163,94,0.12)]">0{index + 1}</span>
            <div>
              <p className="text-sm font-black text-[#f0f6ff]">{row.title}</p>
              <p className="mt-1 text-[0.82rem] leading-5 text-[#9fb3cb]">{row.detail}</p>
            </div>
            <div className="h-1.5 overflow-hidden bg-[#172740] shadow-[inset_0_1px_3px_rgba(0,0,0,0.36)]">
              <div className="h-full bg-[#f0a35e] shadow-[0_0_16px_rgba(240,163,94,0.28)]" style={{ width: `${62 - index * 12}%` }} />
            </div>
          </div>
        ))}
      </div>

      <ResearchPanel tone="red">
        <PanelTitle title="Risks · ranked by severity × probability" />
        <div className="mt-4 space-y-2">
          {riskRows.map(([rank, title, severity, label, color, expanded]) => (
            <div
              key={title}
              className="rounded-lg p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_0_0_1px_color-mix(in_srgb,var(--border)_74%,transparent),0_12px_30px_rgba(0,0,0,0.22)]"
              style={{
                background: `radial-gradient(ellipse at 4% 0%, color-mix(in srgb, ${color} 9%, transparent), transparent 32%), linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_88%,transparent),color-mix(in_srgb,var(--surface)_82%,transparent))`,
              }}
            >
              <div className="grid gap-3 md:grid-cols-[3rem_minmax(0,1fr)_13rem_10rem_1.5rem] md:items-center">
                <span className="font-black text-[var(--info)]">{rank}</span>
                <p className="font-black text-[var(--text-primary)]">{title}</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--info)_12%,transparent)]">
                  <div className="h-full rounded-full shadow-[0_0_14px_currentColor]" style={{ width: `${severity}%`, background: color, color }} />
                </div>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
                <span className="text-right text-[var(--text-muted)]">{expanded ? "^" : "v"}</span>
              </div>
              {expanded ? (
                <div className="mt-4 space-y-4 md:ml-12">
                  <p className="max-w-6xl text-sm font-semibold leading-6 text-[var(--text-secondary)]">
                    iPhone unit sales in China are down about 19% YoY per Counterpoint, with Huawei taking premium-tier share. Greater China is roughly 18% of Apple revenue. If the trend continues, this could represent another 2-4% drag on consolidated revenue growth.
                  </p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-md border border-[color-mix(in_srgb,var(--gain)_32%,transparent)] bg-[color-mix(in_srgb,var(--gain)_9%,var(--surface))] p-3">
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[var(--gain)]">Mitigants</p>
                      <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">Services in China is sticky; India and Vietnam growing fast; Apple has flexibility on iPhone pricing and mix.</p>
                    </div>
                    <div className="rounded-md border border-[color-mix(in_srgb,var(--info)_32%,transparent)] bg-[color-mix(in_srgb,var(--info)_9%,var(--surface))] p-3">
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[var(--info)]">What to watch</p>
                      <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">Counterpoint monthly data, JD.com / Tmall promotional pricing, management commentary on the China line.</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </ResearchPanel>
    </section>
  );
}

function SegmentPanel() {
  const trendSets = [
    [30, 42, 26, 18, 34, 28, 46, 38],
    [20, 31, 44, 58, 24, 27, 39, 62],
    [48, 16, 23, 19, 58, 24, 30, 44],
    [32, 50, 26, 38, 30, 46, 54, 36],
    [45, 22, 50, 25, 31, 44, 52, 20],
  ];
  const segmentMixFills = [
    "color-mix(in srgb, var(--info) 65%, var(--surface))",
    "color-mix(in srgb, var(--accent-ai) 65%, var(--surface))",
    "color-mix(in srgb, var(--gain) 65%, var(--surface))",
    "color-mix(in srgb, var(--warn) 65%, var(--surface))",
    "color-mix(in srgb, var(--loss) 65%, var(--surface))",
  ];

  return (
    <section className="space-y-4">
      <TabSummaryBanner>
        Apple&apos;s revenue mix is in <Highlight tone="warn">slow transformation</Highlight>: iPhone is still about half the business but <Highlight tone="loss">flat-to-down</Highlight> for three years, while Services compounds at <Highlight tone="gain">+14% YoY</Highlight> at much higher margins. <Highlight tone="gain">Services growth</Highlight> is the segment most closely tied to the revenue trajectory.
      </TabSummaryBanner>

      <div
        className="border border-[#3c6794]/55 bg-[radial-gradient(circle_at_16%_0%,rgba(75,148,255,0.19),transparent_22rem),radial-gradient(circle_at_86%_20%,rgba(128,217,225,0.11),transparent_16rem),linear-gradient(180deg,#0e2034,#07111f)] shadow-[0_32px_86px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(128,217,225,0.08),inset_0_-34px_68px_rgba(3,7,13,0.26)] xl:col-span-2"
        style={{
          ...groundedSurface,
          background: "radial-gradient(ellipse at 16% 0%, rgba(125,166,217,0.075), transparent 34%), radial-gradient(ellipse at 92% 18%, rgba(114,199,190,0.045), transparent 30%), var(--surface-grounded)",
        }}
      >
      <HeaderKicker label="Last quarter · by segment" right="Q2 FY25 · $89.3B total" />
      <div className="px-3 py-3">
        <div className="mb-2 flex h-2.5 overflow-hidden rounded-full">
          {segments.map(([name, , share], index) => (
            <div
              key={name}
              style={{
                width: share,
                background: segmentMixFills[index],
                borderRight: index < segments.length - 1 ? "1px solid var(--bg)" : undefined,
              }}
            />
          ))}
        </div>
        <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--text-secondary)]">
          {segments.map(([name, , share], index) => (
            <LegendDot key={name} color={segmentColors[index]} label={`${name} ${share}`} />
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] border-collapse text-left text-[0.82rem]">
            <thead className="text-[0.62rem] uppercase tracking-[0.18em] text-[#7b95b6]">
              <tr className="border-b border-[#1e395c]/70">
                <th className="py-2">Segment</th>
                <th>Rev ($B)</th>
                <th>Share</th>
                <th>YoY</th>
                <th>8Q Trend</th>
                <th>What it means</th>
              </tr>
            </thead>
            <tbody>
              {segments.map(([segment, revenue, share, yoy, note], index) => (
                <tr
                  key={segment}
                  className={`border-b border-[#1b3352]/60 last:border-b-0 hover:bg-[#10233a] ${
                    index % 2 === 0
                      ? "bg-[linear-gradient(180deg,rgba(16,35,56,0.42),rgba(8,20,33,0.16))]"
                      : "bg-[linear-gradient(180deg,rgba(10,24,40,0.28),rgba(6,15,27,0.12))]"
                  }`}
                >
                  <td className="py-3.5 font-black text-[#edf5ff]">
                    <span className="mr-2 inline-block h-2 w-2 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: segmentColors[index], color: segmentColors[index] }} />
                    {segment}
                  </td>
                  <td className="font-black text-[#edf5ff]" data-numeric>{revenue}</td>
                  <td className="text-[#a3b6ce]" data-numeric>
                    <span className="mr-2 inline-block h-1.5 w-14 bg-[#132944] align-middle">
                      <span className="block h-full" style={{ width: share, backgroundColor: segmentColors[index] }} />
                    </span>
                    {share}
                  </td>
                  <td className={yoy.startsWith("+") ? "font-black text-[#42d694]" : "font-black text-[#ff6f78]"} data-numeric>
                    {yoy}
                  </td>
                  <td>
                    <MiniBars values={trendSets[index]} color={segmentColors[index]} />
                  </td>
                  <td className="max-w-[26rem] leading-5 text-[#a3b6ce]">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      <SegmentLowerPanels />
    </section>
  );
}

function HistoryPanel() {
  return (
    <section className="space-y-4">
      <TabSummaryBanner>
        AAPL has beaten consensus EPS in <Highlight tone="gain">6 of the last 8 quarters</Highlight>, but the average next-day stock reaction has been <Highlight tone="warn">roughly flat (about -0.1%)</Highlight>. Recent moves have tracked <Highlight tone="loss">China commentary</Highlight> and product-roadmap detail more than the headline result.
      </TabSummaryBanner>
    <div className="hidden">
      <HeaderKicker label="History / static preview" right="5 rows" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left text-[0.8rem]">
          <thead className="text-[0.62rem] uppercase tracking-[0.18em] text-[#7b95b6]">
            <tr className="border-b border-[#1e395c]/70">
              <th className="px-3 py-2">Quarter</th>
              <th>Date</th>
              <th>EPS</th>
              <th>Revenue</th>
              <th>Verdict</th>
              <th>Stock +1D</th>
            </tr>
          </thead>
          <tbody>
            {historyRows.map(([quarter, date, eps, revenue, verdict, move], index) => (
              <tr
                key={quarter}
                className={`border-b border-[#1b3352]/60 last:border-b-0 hover:bg-[#10233a] ${
                  index % 2 === 0
                    ? "bg-[linear-gradient(180deg,rgba(16,35,56,0.42),rgba(8,20,33,0.16))]"
                    : "bg-[linear-gradient(180deg,rgba(10,24,40,0.28),rgba(6,15,27,0.12))]"
                }`}
              >
                <td className="px-3 py-3.5 font-black text-[#edf5ff]">{quarter}</td>
                <td className="text-[#a3b6ce]">{date}</td>
                <td className="font-black text-[#42d694]" data-numeric>{eps}</td>
                <td className="font-black text-[#edf5ff]" data-numeric>{revenue}</td>
                <td>
                  <span className="rounded bg-[#2b2c44] px-2 py-1 text-[0.62rem] font-black text-[#f0b35f]">
                    {verdict}
                  </span>
                </td>
                <td className={move.startsWith("+") ? "font-black text-[#42d694]" : "font-black text-[#ff6f78]"} data-numeric>
                  {move}
                  <span className="ml-3 inline-block h-1.5 w-14 bg-[#132944] align-middle">
                    <span className={move.startsWith("+") ? "block h-full bg-[#42d694]" : "block h-full bg-[#ff6f78]"} style={{ width: move.startsWith("+") ? "72%" : "42%" }} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
      <HistoryTable />
    </section>
  );
}

function BusinessPanel() {
  const working = [
    "Services growth, accretive to margin",
    "Capital return, ~4% repurchase yield",
    "Installed base still expanding",
    "Vertical integration (silicon → OS → store)",
  ];
  const pressure = [
    "iPhone replacement cycle lengthening",
    "China revenue declining (~-8% YoY)",
    "Regulatory pressure on App Store fees",
    "AI strategy seen as reactive vs peers",
  ];

  return (
    <section className="space-y-4">
      <TabSummaryBanner>
        The model in one sentence: Apple builds premium hardware, locks users into the ecosystem, monetizes them recurring through <Highlight tone="gain">Services</Highlight> (at roughly <Highlight tone="gain">2x hardware margins</Highlight>), and returns free cash flow as repurchases. The model depends on the <Highlight tone="gain">installed base continuing to grow</Highlight> and Services attaching deeper to each device.
      </TabSummaryBanner>
    <div className="hidden">
      <HeaderKicker label="Business context" right="Static preview" />
      <div className="grid gap-px bg-[#1e395c]/45 p-px sm:grid-cols-2">
        {["Installed base", "Hardware mix", "Services", "Cash flow"].map((item, index) => (
          <div key={item} className="relative overflow-hidden bg-[radial-gradient(circle_at_100%_0%,rgba(128,217,225,0.09),transparent_8rem),linear-gradient(180deg,#112640,#091523)] p-3.5 shadow-[inset_0_-14px_28px_rgba(3,7,13,0.20)] transition-colors hover:bg-[#10253d]">
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#80d9e1]/40 to-transparent" />
            <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#7b95b6]">{item}</p>
            <p className="mt-1 text-lg font-black text-[#edf5ff]" data-numeric>
              {["2.2B", "~72%", "~27%", "$108B/yr"][index]}
            </p>
            <p className="mt-1 text-[0.8rem] leading-5 text-[#a3b6ce]">
              Sample context block for visual structure only.
            </p>
          </div>
        ))}
      </div>
    </div>
      <ResearchPanel tone="green">
        <PanelTitle title="How Apple makes money" />
        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] xl:items-stretch">
          {[
            ["Installed base", "2.2B", "Active Apple devices worldwide; grew from 1.0B in 2016. Every device is a future Services customer."],
            ["Hardware", "~72% of rev", "iPhone, Mac, iPad, Wearables. Margin ~36%. Replacement cycle lengthened from ~3yrs to ~4yrs."],
            ["Services", "~27% of rev", "App Store, Google licensing, iCloud, AppleCare, Music/TV+, advertising. Margin ~71%, growing 14% YoY."],
            ["FCF", "$108B/yr", "Free cash flow funding repurchases and dividends; capital allocation is the third leg of the model."],
          ].map(([label, value, detail], index, cards) => (
            <div key={label} className="contents">
              <div
                className="rounded-lg bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_92%,transparent),color-mix(in_srgb,var(--surface)_86%,transparent))] p-4 shadow-[inset_0_0_0_1px_var(--border),0_14px_36px_rgba(0,0,0,0.22)]"
                style={{
                  ...groundedSurface,
                  background: `radial-gradient(ellipse at 12% 0%, ${groundedAccent[(["cyan", "blue", "violet", "green"] as GroundedTone[])[index]]}, transparent 34%), linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_78%,transparent),color-mix(in_srgb,var(--surface)_86%,transparent))`,
                }}
              >
                <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-[var(--accent)]">{label}</p>
                <p className="mt-2 text-2xl font-black text-[var(--text-primary)]" data-numeric>{value}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{detail}</p>
              </div>
              {index < cards.length - 1 ? (
                <div className="hidden place-items-center text-2xl font-black text-[var(--info)] xl:grid">→</div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <IntelligenceList title="What's working" tone="gain" items={working} />
          <IntelligenceList title="What's under pressure" tone="loss" items={pressure} />
        </div>
      </ResearchPanel>
    </section>
  );
}

function TabSummaryBanner({ children }: { children: ReactNode }) {
  return (
    <div
      className="mt-2 flex gap-3 rounded-lg px-4 py-3 text-sm font-semibold leading-6 text-[var(--text-primary)] shadow-[0_18px_46px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.05)]"
      style={groundedSurface}
    >
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--accent-ai)] text-[0.72rem] font-black text-white shadow-[0_0_16px_rgba(139,132,199,0.36)]">
        +
      </span>
      <p>{children}</p>
    </div>
  );
}

function Highlight({ tone, children }: { tone: "gain" | "loss" | "warn" | "info"; children: ReactNode }) {
  const colorMap = {
    gain: "var(--gain)",
    loss: "var(--loss)",
    warn: "var(--warn)",
    info: "var(--info)",
  };

  return (
    <span className="font-black" style={{ color: colorMap[tone] }} data-numeric>
      {children}
    </span>
  );
}

function ResearchPanel({ children, tone = "cyan" }: { children: ReactNode; tone?: GroundedTone }) {
  return (
    <div
      className="rounded-xl p-4 shadow-[0_28px_84px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-26px_60px_rgba(0,0,0,0.18)] transition-colors"
      style={{
        ...groundedSurface,
        background: `radial-gradient(ellipse at 14% 0%, ${groundedAccent[tone]}, transparent 34%), radial-gradient(ellipse at 92% 100%, rgba(2,6,12,0.18), transparent 46%), var(--surface-grounded)`,
      }}
    >
      {children}
    </div>
  );
}

function PanelTitle({ title }: { title: string }) {
  return (
    <p className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.2em] text-[var(--info)]">
      <BarChart3 className="h-3.5 w-3.5 text-[var(--accent)]" />
      {title}
    </p>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm shadow-[0_0_10px_currentColor]" style={{ background: color, color }} />
      {label}
    </span>
  );
}

function MiniBars({ values, color }: { values: number[]; color: string }) {
  return (
    <span className="inline-flex h-8 items-end gap-1">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="w-2 rounded-t-sm opacity-75 shadow-[0_0_10px_currentColor]"
          style={{ height: `${value}%`, background: color, color }}
        />
      ))}
    </span>
  );
}

function ValuationTable() {
  const valuationRows = [
    ["P/E (TTM)", "28.4", "24.8", "MSFT 35.2", "+15% vs hist", 62, "warn"],
    ["Fwd P/E", "26.1", "22.4", "MSFT 29.8", "+17%", 67, "warn"],
    ["EV/EBITDA", "21.7", "19.1", "MSFT 23.4", "+14%", 70, "warn"],
    ["FCF yield", "3.4%", "4.1%", "MSFT 2.9%", "-17%", 42, "gain"],
    ["PEG (5y)", "3.2", "2.4", "MSFT 1.8", "+33%", 78, "warn"],
    ["P/Sales", "8.9", "6.7", "MSFT 12.4", "+33%", 61, "warn"],
  ] as const;

  return (
    <ResearchPanel tone="amber">
      <PanelTitle title="Valuation vs history vs peers" />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
          <thead className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <tr className="border-b border-[var(--border)]">
              <th className="py-3">Metric</th>
              <th>Current</th>
              <th>vs 5Y Avg</th>
              <th>5Y Avg</th>
              <th>Peer</th>
              <th className="text-right">Read</th>
            </tr>
          </thead>
          <tbody>
            {valuationRows.map(([metric, current, average, peer, read, position, tone]) => (
              <tr key={metric} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[color-mix(in_srgb,var(--info)_7%,transparent)]">
                <td className="py-4 font-black text-[var(--text-primary)]">{metric}</td>
                <td className="font-black text-[var(--text-primary)]" data-numeric>{current}</td>
                <td>
                  <div className="relative h-7 w-72">
                    <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[color-mix(in_srgb,var(--info)_24%,transparent)]" />
                    <span className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-[var(--info)]" style={{ left: "22%" }} />
                    <span className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-[var(--info)]" style={{ right: "22%" }} />
                    <span
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[0.58rem] font-black text-[#07101a]"
                      style={{
                        left: `${position}%`,
                        background: tone === "gain" ? "var(--gain)" : "var(--warn)",
                      }}
                    >
                      now
                    </span>
                  </div>
                </td>
                <td className="text-[var(--text-secondary)]" data-numeric>{average}</td>
                <td className="text-[var(--text-secondary)]" data-numeric>{peer}</td>
                <td
                  className="text-right font-black"
                  data-numeric
                  style={{ color: tone === "gain" ? "var(--gain)" : "var(--warn)" }}
                >
                  {read}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ResearchPanel>
  );
}

function SegmentLowerPanels() {
  const services = [
    ["App Store", "$26B", 82],
    ["Licensing (Google)", "$22B", 70],
    ["iCloud + storage", "$16B", 53],
    ["AppleCare", "$11B", 42],
    ["Apple Music + TV+", "$10B", 34],
    ["Advertising + other", "$11B", 39],
  ] as const;
  const geographies = [
    ["Americas", "$37.3B", "+1.2%"],
    ["Europe", "$24.1B", "-0.7%"],
    ["Greater China ⚠", "$16.4B", "-8.1%"],
    ["Japan", "$6.5B", "+12.4%"],
    ["Rest of Asia Pac", "$5.0B", "-1.8%"],
  ] as const;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ResearchPanel tone="violet">
        <PanelTitle title="Services deep dive" />
        <p className="mt-3 text-sm text-[var(--text-secondary)]">The ~$96B/yr line that is still growing.</p>
        <div className="mt-4 space-y-3">
          {services.map(([label, value, width]) => (
            <div key={label} className="grid grid-cols-[minmax(0,1fr)_6rem_4rem] items-center gap-3 text-sm">
              <span className="font-semibold text-[var(--text-primary)]">{label}</span>
              <span className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--accent-ai)_12%,transparent)]">
                <span className="block h-full rounded-full bg-[var(--accent-ai)]" style={{ width: `${width}%` }} />
              </span>
              <span className="text-right font-black text-[var(--text-primary)]" data-numeric>{value}</span>
            </div>
          ))}
        </div>
      </ResearchPanel>
      <ResearchPanel tone="blue">
        <PanelTitle title="Geographic mix" />
        <p className="mt-3 text-sm text-[var(--text-secondary)]">Where revenue comes from, and where the pressure is.</p>
        <div className="mt-4 divide-y divide-[var(--border)]">
          {geographies.map(([region, value, move]) => (
            <div key={region} className="grid grid-cols-[minmax(0,1fr)_5rem_4rem] items-center gap-3 py-2.5 text-sm">
              <span className="font-semibold text-[var(--text-primary)]">{region}</span>
              <span className="text-right text-[var(--text-secondary)]" data-numeric>{value}</span>
              <span className="text-right font-black" style={{ color: move.startsWith("+") ? "var(--gain)" : "var(--loss)" }} data-numeric>{move}</span>
            </div>
          ))}
        </div>
      </ResearchPanel>
    </div>
  );
}

function HistoryTable() {
  return (
    <ResearchPanel tone="blue">
      <div className="flex items-center justify-between gap-3">
        <PanelTitle title="Last 8 quarters" />
        <span className="text-xs font-semibold text-[var(--text-muted)]">Next: <span className="font-black text-[var(--text-primary)]">Aug 1, AMC</span> · 8q tracked</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
          <thead className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <tr className="border-b border-[var(--border)]">
              <th className="py-3">Quarter</th>
              <th>Date</th>
              <th>EPS · Act / Est</th>
              <th>Rev ($B) · Act / Est</th>
              <th>Verdict</th>
              <th>Stock +1D</th>
            </tr>
          </thead>
          <tbody>
            {historyRows.map(([quarter, date, epsActual, epsEst, revActual, revEst, verdict, move], index) => {
              const epsBeat = Number(epsActual.replace("$", "")) > Number(epsEst.replace("$", ""));
              const revBeat = Number(revActual.replace("$", "")) > Number(revEst.replace("$", ""));
              return (
                <tr
                  key={quarter}
                  className={`border-b border-[var(--border)] last:border-b-0 hover:bg-[color-mix(in_srgb,var(--info)_7%,transparent)] ${
                    index % 2 === 0
                      ? "bg-[color-mix(in_srgb,var(--surface-elevated)_70%,transparent)]"
                      : "bg-[color-mix(in_srgb,var(--surface)_66%,transparent)]"
                  }`}
                >
                  <td className="py-3.5 font-black text-[var(--text-primary)]">{quarter}</td>
                  <td className="text-[var(--text-secondary)]">{date}</td>
                  <td data-numeric>
                    <span className="font-black" style={{ color: epsBeat ? "var(--gain)" : "var(--loss)" }}>{epsActual}</span>
                    <span className="text-[var(--text-muted)]"> / {epsEst}</span>
                  </td>
                  <td data-numeric>
                    <span className="font-black" style={{ color: revBeat ? "var(--gain)" : "var(--loss)" }}>{revActual}</span>
                    <span className="text-[var(--text-muted)]"> / {revEst}</span>
                  </td>
                  <td>
                    <span
                      className="rounded px-2 py-1 text-[0.62rem] font-black uppercase"
                      style={{
                        background: verdict === "Beat" ? "color-mix(in srgb, var(--gain) 16%, transparent)" : "color-mix(in srgb, var(--warn) 18%, transparent)",
                        color: verdict === "Beat" ? "var(--gain)" : "var(--warn)",
                      }}
                    >
                      {verdict}
                    </span>
                  </td>
                  <td className="font-black" style={{ color: move.startsWith("+") ? "var(--gain)" : "var(--loss)" }} data-numeric>
                    {move}
                    <span className="ml-3 inline-block h-1.5 w-16 rounded-full bg-[color-mix(in_srgb,var(--info)_12%,transparent)] align-middle">
                      <span className="block h-full rounded-full" style={{ width: move.startsWith("+") ? "72%" : "46%", background: move.startsWith("+") ? "var(--gain)" : "var(--loss)" }} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ResearchPanel>
  );
}

function IntelligenceList({ title, tone, items }: { title: string; tone: "gain" | "loss"; items: string[] }) {
  const color = tone === "gain" ? "var(--gain)" : "var(--loss)";

  return (
    <div
      className="rounded-lg p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      style={{
        background: `color-mix(in srgb, ${color} 9%, var(--surface))`,
        border: `1px solid color-mix(in srgb, ${color} 34%, transparent)`,
      }}
    >
      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em]" style={{ color }}>
        {title}
      </p>
      <ul className="mt-3 space-y-1.5 text-sm font-semibold leading-5 text-[var(--text-primary)]">
        {items.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}

function HeaderKicker({ label, right }: { label: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#315a83]/70 bg-[radial-gradient(circle_at_0%_0%,rgba(128,217,225,0.11),transparent_12rem),linear-gradient(180deg,#132842,#07111f)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(180,224,255,0.13),0_12px_28px_rgba(0,0,0,0.18)]">
      <p className="inline-flex items-center gap-2 text-[0.64rem] font-black uppercase tracking-[0.2em] text-[#b6d9f2]">
        {sectionIcon(label)}
        {label}
      </p>
      <p className="text-[0.7rem] font-bold text-[#9fb3cb]">{right}</p>
    </div>
  );
}

function sectionIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("challenge") || normalized.includes("risk")) {
    return <ShieldAlert className="h-3.5 w-3.5 text-[var(--warn)]" />;
  }

  if (normalized.includes("read")) {
    return <Sparkles className="h-3.5 w-3.5 text-[var(--accent-ai)]" />;
  }

  return <BarChart3 className="h-3.5 w-3.5 text-[var(--accent)]" />;
}

function PrototypeDisclaimer() {
  return (
    <p className="mt-4 border border-[#24456d]/70 bg-[linear-gradient(90deg,rgba(7,17,31,0.94),rgba(7,17,31,0.72))] px-3 py-2 text-xs text-[#8ea4c0] shadow-[0_18px_42px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(128,217,225,0.06)] backdrop-blur-sm">
      ALQIS explanations are informational only and do not constitute investment advice. This route is a visual prototype with sample data.
    </p>
  );
}
