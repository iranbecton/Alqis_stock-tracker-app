import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#030812] text-[#eef6ff]">
      <AuthAtmosphere />
      <AuthTopBar />

      <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[96rem] flex-col items-center justify-center px-4 pb-12 pt-10 text-center sm:px-8">
        <div className="flex flex-col items-center">
          <div className="rounded-full border border-[#23446f]/80 bg-[#071425]/78 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#7bbcff] shadow-[0_0_32px_rgba(45,128,255,0.12)]">
            AI-native market intelligence
          </div>

          <h1 className="mt-6 max-w-5xl font-serif text-[3.2rem] leading-[0.94] tracking-tight text-[#f3f7ff] min-[430px]:text-[4.2rem] sm:text-[6.4rem] lg:text-[7rem]">
            Why <span className="italic text-[#4c9dff]">is</span> it moving?
          </h1>

          <p className="mt-5 max-w-3xl font-serif text-[1.15rem] italic leading-7 text-[#9aacc4] sm:text-[1.55rem]">
            We tell you. In plain English. The moment it happens.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary" size="lg" className="min-w-36 bg-[#4f8dff] shadow-[0_0_32px_rgba(79,141,255,0.28)]">
              <Link href="/signup">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="quiet" size="lg" className="min-w-32 border border-[#203b61] bg-[#07111e]/72">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="relative mt-8 h-[24rem] w-full max-w-[58rem] sm:mt-6 sm:h-[30rem]">
          <CinematicChart />
          <FloatingReadCard />
        </div>
      </section>
    </main>
  );
}

export function AuthTopBar() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-[104rem] items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" aria-label="ALQIS home">
        <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
      </Link>
      <nav className="flex items-center gap-4 text-sm font-medium text-[#8fa3bd]">
        <Link href="/#why-alqis" className="hidden transition hover:text-[#eef6ff] sm:inline">
          Why ALQIS
        </Link>
        <Link href="/#pricing" className="hidden transition hover:text-[#eef6ff] sm:inline">
          Pricing
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-[#203b61]/75 bg-[#07111e]/72 px-3.5 py-2 text-[#dbeaff] transition hover:border-[#4f8dff]/60"
        >
          Sign In
        </Link>
      </nav>
    </header>
  );
}

export function AuthAtmosphere() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_17%_38%,rgba(36,114,206,0.15),transparent_22%),radial-gradient(circle_at_80%_76%,rgba(99,73,180,0.16),transparent_22%),linear-gradient(180deg,#040914_0%,#02060d_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(120,170,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(120,170,255,0.06)_1px,transparent_1px)] [background-size:72px_72px]" />
    </>
  );
}

export function CinematicChart() {
  return (
    <svg
      viewBox="0 0 920 430"
      className="absolute inset-0 h-full w-full overflow-visible"
      role="img"
      aria-label="Stylized ALQIS market chart visual"
    >
      <defs>
        <linearGradient id="alqis-landing-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#244a89" />
          <stop offset="55%" stopColor="#347fd8" />
          <stop offset="100%" stopColor="#23c47a" />
        </linearGradient>
        <linearGradient id="alqis-landing-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2e86ff" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#2e86ff" stopOpacity="0" />
        </linearGradient>
        <filter id="alqis-landing-glow" x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M28 336 C95 312 142 324 205 300 C260 278 315 294 372 284 C426 274 475 251 526 262 C574 273 610 263 650 237 C682 216 684 166 716 123 C742 88 770 72 807 62 C836 54 854 40 890 36"
        fill="none"
        stroke="rgba(46,134,255,0.16)"
        strokeWidth="16"
        filter="url(#alqis-landing-glow)"
      />
      <path
        d="M28 336 C95 312 142 324 205 300 C260 278 315 294 372 284 C426 274 475 251 526 262 C574 273 610 263 650 237 C682 216 684 166 716 123 C742 88 770 72 807 62 C836 54 854 40 890 36"
        fill="none"
        stroke="url(#alqis-landing-line)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M28 336 C95 312 142 324 205 300 C260 278 315 294 372 284 C426 274 475 251 526 262 C574 273 610 263 650 237 C682 216 684 166 716 123 C742 88 770 72 807 62 C836 54 854 40 890 36 L890 420 L28 420 Z"
        fill="url(#alqis-landing-area)"
      />
    </svg>
  );
}

function FloatingReadCard() {
  return (
    <div className="absolute left-1/2 top-4 w-[min(90vw,28rem)] -translate-x-1/2 rounded-[1rem] border border-[#24466f] bg-[#0a1424]/92 px-4 py-3.5 text-left shadow-[0_24px_70px_rgba(0,8,20,0.5),inset_0_1px_0_rgba(120,170,255,0.09)] backdrop-blur-xl sm:top-8">
      <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold">
        <span className="rounded-full bg-[#123d73] px-2 py-1 text-[#9ed4ff]">ALQIS</span>
        <span className="text-[#dbeaff]">NVDA</span>
        <span className="text-[#91a9c6]">$862.86</span>
        <span className="text-gain">+1.32%</span>
        <span className="ml-auto text-[#5f7898]">just now</span>
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-[#eaf3ff]">
        Datacenter demand and guidance strength appear to be lifting the move.
      </p>
    </div>
  );
}
