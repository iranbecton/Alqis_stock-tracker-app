"use client";

import type { MarketSession } from "@/lib/market/brief";

const sessions: Array<{
  id: MarketSession;
  label: string;
  icon: string;
}> = [
  { id: "pre_market", label: "Pre-market", icon: "US" },
  { id: "market_open", label: "Market open", icon: "*" },
  { id: "midday", label: "Midday", icon: "o" },
  { id: "after_close", label: "After close", icon: "+" },
  { id: "weekend", label: "Weekend", icon: "#" },
];

type BriefSessionResponse = {
  session?: MarketSession;
};

export function SessionTabs({ brief }: { brief: BriefSessionResponse | null }) {
  const activeSession = brief?.session ?? "pre_market";

  return (
    <nav
      aria-label="Market session"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div className="flex min-w-max gap-1.5 rounded-[0.9rem] border border-[rgba(86,126,176,0.22)] bg-[linear-gradient(180deg,rgba(10,20,35,0.96),rgba(5,10,18,0.93))] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_10px_26px_rgba(2,6,12,0.25)]">
        {sessions.map((session, index) => {
          const isActive = session.id === activeSession;

          return (
            <button
              key={session.id}
              type="button"
              className={
                isActive
                  ? "inline-flex min-h-8 items-center gap-1.5 rounded-[0.7rem] border border-[rgba(91,140,255,0.26)] bg-[linear-gradient(180deg,rgba(55,92,154,0.34),rgba(20,42,72,0.34))] px-3.5 text-[0.78rem] font-semibold text-[#d0e0f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_14px_rgba(91,140,255,0.08)]"
                  : "inline-flex min-h-8 items-center gap-1.5 rounded-[0.7rem] border border-transparent px-3.5 text-[0.78rem] font-semibold text-[var(--ink-subtle)] transition hover:border-[rgba(86,126,176,0.25)] hover:bg-[#102033] hover:text-[#d9e9ff]"
              }
              aria-current={isActive ? "page" : undefined}
            >
              <span className={getSessionIconClass(index)}>{session.icon}</span>
              {session.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function getSessionIconClass(index: number) {
  if (index === 1) return "text-[var(--warn)]";
  if (index === 2) return "text-[var(--accent-ai)]";
  if (index === 3) return "text-[var(--info)]";
  return "text-[var(--accent)]";
}
