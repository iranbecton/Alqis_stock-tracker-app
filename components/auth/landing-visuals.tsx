"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const chartData = [
  { t: 0, price: 412 },
  { t: 1, price: 418 },
  { t: 2, price: 415 },
  { t: 3, price: 421 },
  { t: 4, price: 435 },
  { t: 5, price: 441 },
  { t: 6, price: 438 },
  { t: 7, price: 450 },
  { t: 8, price: 458 },
  { t: 9, price: 455 },
  { t: 10, price: 462 },
];

type LandingVisualProps = {
  className?: string;
  compact?: boolean;
  previewCopy?: string;
};

export function LandingShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "relative min-h-dvh overflow-hidden bg-[#050910] text-ink",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_19%_31%,rgba(40,111,203,0.16),transparent_24%),radial-gradient(circle_at_79%_76%,rgba(115,82,189,0.18),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_38%)]",
        "after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(rgba(120,165,220,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(120,165,220,0.026)_1px,transparent_1px)] after:bg-[size:68px_68px] after:opacity-35",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </main>
  );
}

export function LandingTopBar() {
  return (
    <header className="mx-auto flex w-full max-w-[92rem] items-center justify-between px-4 py-3 sm:px-7 sm:py-4 lg:px-10">
      <Link href="/" aria-label="ALQIS home" className="inline-flex items-center">
        <Image
          src="/brand/alqis-lockup.svg"
          alt="ALQIS"
          width={216}
          height={56}
          priority
          className="block h-9 w-auto object-contain"
        />
      </Link>
      <nav
        aria-label="Signed out navigation"
        className="flex items-center gap-2 text-[0.72rem] font-semibold text-blue-100/58 sm:gap-4"
      >
        <a href="#why-alqis" className="hidden transition-colors hover:text-blue-100 sm:inline">
          Why ALQIS
        </a>
        <a href="#pricing" className="hidden transition-colors hover:text-blue-100 sm:inline">
          Pricing
        </a>
        <Link
          href="/login"
          className="rounded-xl border border-blue-200/12 bg-blue-950/20 px-3 py-2 text-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-blue-200/22 hover:bg-blue-900/26"
        >
          Sign In
        </Link>
      </nav>
    </header>
  );
}

export function LandingHero() {
  return (
    <LandingShell>
      <LandingTopBar />
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[92rem] flex-col items-center px-4 pb-10 pt-8 text-center sm:px-8 sm:pb-12 sm:pt-16 lg:px-10">
        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/16 bg-blue-500/8 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-blue-200 shadow-[0_0_36px_rgba(66,142,255,0.12)]">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            AI-native market intelligence
          </div>

          <h1 className="mt-5 font-serif text-[clamp(3.1rem,15vw,5rem)] leading-[0.86] tracking-[-0.07em] text-[#eef5ff] sm:mt-6 sm:text-[clamp(3.5rem,10vw,7.7rem)]">
            Why <span className="italic text-[#4c91ff]">is</span> it moving?
          </h1>
          <p className="mt-5 font-serif text-[clamp(1.05rem,2.2vw,1.65rem)] italic leading-relaxed text-blue-100/62">
            We tell you. In plain English. The moment it happens.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row">
            <Button
              asChild
              variant="primary"
              size="lg"
              className="h-12 min-w-36 rounded-xl bg-[#72c7be] text-[#070F14] shadow-[0_0_36px_rgba(77,141,255,0.32)] hover:bg-[#5ab5ac]"
            >
              <Link href="/signup">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="h-12 min-w-32 rounded-xl border-blue-200/14 bg-blue-950/16 text-blue-50 hover:border-blue-200/28 hover:bg-blue-900/24"
            >
              <Link href="/login">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <LandingAnimatedChartVisual className="mt-4 w-full" />

        <div className="sr-only" id="why-alqis">
          ALQIS explains market movement in plain English.
        </div>
        <div className="sr-only" id="pricing">
          ALQIS pricing information is coming soon.
        </div>
      </section>
    </LandingShell>
  );
}

function LandingAnimatedChartVisual({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto h-[min(38dvh,30rem)] min-h-[18rem] w-full max-w-5xl",
        className
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_66%_52%,rgba(47,140,255,0.13),transparent_46%),radial-gradient(ellipse_at_74%_62%,rgba(66,217,145,0.08),transparent_34%)]" />
      <div className="absolute left-0 top-[90px] z-10 max-w-[min(92vw,340px)] text-left sm:left-6">
        <div
          style={{
            background: "var(--surface-raised)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            maxWidth: "340px",
            padding: "12px 16px",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: "8px", marginBottom: "6px" }}>
            <span
              style={{
                color: "#72c7be",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              ALQIS
            </span>
            <span style={{ color: "#F4EEE2", fontSize: "0.75rem", fontWeight: 700 }}>NVDA</span>
            <span style={{ color: "#F4EEE2", fontSize: "0.75rem", opacity: 0.7 }}>$462.86</span>
            <span style={{ color: "#63cfa8", fontSize: "0.75rem", fontWeight: 700 }}>+1.32%</span>
            <span
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                color: "rgba(244,238,226,0.4)",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                marginLeft: "auto",
                padding: "2px 6px",
              }}
            >
              PREVIEW
            </span>
          </div>
          <p
            style={{
              color: "rgba(244,238,226,0.85)",
              fontSize: "0.8rem",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Datacenter demand and guidance strength appear to be contributing to the move.
          </p>
        </div>
        <p
          style={{
            color: "rgba(244,238,226,0.3)",
            fontSize: "0.6rem",
            letterSpacing: "0.04em",
            marginTop: "6px",
          }}
        >
          · illustrative
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0 pt-[60px]">
        <div style={{ filter: "drop-shadow(0 0 10px rgba(114, 199, 190, 0.5))" }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#72c7be" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#72c7be" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis hide />
              <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#72c7be"
                strokeWidth={2.5}
                fill="url(#tealGradient)"
                dot={false}
                isAnimationActive={true}
                animationDuration={1800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function LandingChartVisual({ className, compact = false, previewCopy }: LandingVisualProps) {
  return (
    <div
      className={cn(
        "alqis-seamless-chart-field relative mx-auto w-full max-w-5xl",
        compact ? "h-[16rem]" : "h-[min(38dvh,30rem)] min-h-[18rem]",
        className
      )}
      aria-hidden
    >
      <div className="alqis-seamless-chart-atmosphere absolute inset-0" />
      <svg
        viewBox="0 0 1100 390"
        preserveAspectRatio="none"
        className="alqis-seamless-chart-svg absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id="alqisLandingLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#2d5f9d" />
            <stop offset="46%" stopColor="#3c8ff0" />
            <stop offset="74%" stopColor="#29b7d4" />
            <stop offset="100%" stopColor="#49dc9a" />
          </linearGradient>
          <filter id="alqisLandingGlow" x="-20%" y="-70%" width="140%" height="240%">
            <feGaussianBlur stdDeviation="10" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="alqisLandingGridFade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#7fa8e8" stopOpacity="0" />
            <stop offset="24%" stopColor="#7fa8e8" stopOpacity="0.09" />
            <stop offset="58%" stopColor="#7fa8e8" stopOpacity="0.055" />
            <stop offset="100%" stopColor="#7fa8e8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="alqisLandingHaze" cx="66%" cy="50%" r="54%">
            <stop offset="0%" stopColor="#2f8cff" stopOpacity="0.13" />
            <stop offset="50%" stopColor="#1a6fc5" stopOpacity="0.045" />
            <stop offset="100%" stopColor="#050910" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M94 328 C178 302 259 308 344 294 C438 279 527 291 612 253 C675 225 706 245 755 207 C795 176 783 121 832 82 C879 45 930 48 1002 18"
          fill="none"
          stroke="url(#alqisLandingHaze)"
          strokeWidth="92"
          strokeLinecap="round"
          opacity="0.72"
        />
        <path
          d="M50 310 C115 285 165 294 220 276 C280 258 338 276 398 262 C462 248 519 268 585 241 C633 222 672 236 720 215 C754 201 779 120 812 90 C850 56 884 48 930 41 C973 34 996 40 1048 10"
          fill="none"
          stroke="rgba(66,217,145,0.13)"
          strokeWidth="26"
          filter="url(#alqisLandingGlow)"
          strokeLinecap="round"
        />
        <path
          d="M50 310 C115 285 165 294 220 276 C280 258 338 276 398 262 C462 248 519 268 585 241 C633 222 672 236 720 215 C754 201 779 120 812 90 C850 56 884 48 930 41 C973 34 996 40 1048 10"
          fill="none"
          stroke="rgba(69,144,255,0.22)"
          strokeWidth="18"
          filter="url(#alqisLandingGlow)"
          strokeLinecap="round"
        />
        <path
          d="M50 310 C115 285 165 294 220 276 C280 258 338 276 398 262 C462 248 519 268 585 241 C633 222 672 236 720 215 C754 201 779 120 812 90 C850 56 884 48 930 41 C973 34 996 40 1048 10"
          fill="none"
          stroke="url(#alqisLandingLine)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <g stroke="url(#alqisLandingGridFade)" strokeWidth="1">
          <path d="M155 108 H915" />
          <path d="M125 204 H970" />
          <path d="M170 301 H885" />
        </g>
      </svg>
      <AlqisPreviewCard compact={compact} previewCopy={previewCopy} />
    </div>
  );
}

function AlqisPreviewCard({
  compact,
  previewCopy = "Datacenter demand and guidance strength appear to be lifting the move.",
}: {
  compact: boolean;
  previewCopy?: string;
}) {
  return (
    <div
      className={cn(
        "absolute left-1/2 top-7 w-[min(92vw,30rem)] -translate-x-1/2 rounded-2xl border border-blue-300/20 bg-[#0b1424]/88 p-4 text-left shadow-[0_24px_80px_rgba(3,8,17,0.46),0_0_42px_rgba(62,139,255,0.12)] backdrop-blur-xl",
        compact && "top-3 w-[min(92vw,25rem)] p-3"
      )}
    >
      <div className="flex items-center justify-between gap-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-blue-100/54">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-400/12 px-2 py-1 text-blue-200">ALQIS</span>
          <span>NVDA</span>
          <span className="text-blue-100/72">$862.86</span>
          <span className="text-gain">+1.32%</span>
        </div>
        <span className="hidden text-blue-100/40 sm:inline">preview</span>
      </div>
      <p className="mt-3 text-[0.82rem] font-semibold leading-relaxed text-blue-50/88">
        {previewCopy}
      </p>
    </div>
  );
}
