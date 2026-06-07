"use client";

import { useState } from "react";
import {
  BarChart3,
  Building2,
  FileText,
  Landmark,
  LineChart,
  Percent,
  PieChart,
  WalletCards,
  Zap,
  type LucideIcon,
} from "lucide-react";

type PathItem = {
  title: string;
  lessons: string;
  level: string;
  Icon: LucideIcon;
  gradient: string;
  relatedCategory?: string;
};

const paths: PathItem[] = [
  {
    title: "Stock fundamentals",
    lessons: "12 lessons",
    level: "Beginner OK",
    Icon: BarChart3,
    gradient: "linear-gradient(135deg, #1e5fa8, #2d8fd4)",
    relatedCategory: "Fundamentals",
  },
  {
    title: "How to read a chart",
    lessons: "6 lessons",
    level: "Beginner OK",
    Icon: LineChart,
    gradient: "linear-gradient(135deg, #1a7a3a, #28b857)",
    relatedCategory: "Charts",
  },
  {
    title: "Earnings",
    lessons: "9 lessons",
    level: "Beginner OK",
    Icon: WalletCards,
    gradient: "linear-gradient(135deg, #b85c10, #e07820)",
    relatedCategory: "Earnings",
  },
  {
    title: "Sectors & themes",
    lessons: "7 lessons",
    level: "Intermediate",
    Icon: Building2,
    gradient: "linear-gradient(135deg, #0e6f74, #22a5a9)",
    relatedCategory: "Market Structure",
  },
  {
    title: "Macro & Fed",
    lessons: "10 lessons",
    level: "Beginner OK",
    Icon: Landmark,
    gradient: "linear-gradient(135deg, #0e7a7a, #18b8b8)",
    relatedCategory: "Macro",
  },
  {
    title: "Risk & diversification",
    lessons: "8 lessons",
    level: "Beginner OK",
    Icon: PieChart,
    gradient: "linear-gradient(135deg, #a82020, #d43030)",
  },
  {
    title: "Behavioral finance",
    lessons: "6 lessons",
    level: "Intermediate",
    Icon: Zap,
    gradient: "linear-gradient(135deg, #1a4a8a, #2868c0)",
  },
  {
    title: "Options basics",
    lessons: "8 lessons",
    level: "Intermediate",
    Icon: Percent,
    gradient: "linear-gradient(135deg, #7a7010, #b8a818)",
  },
  {
    title: "Tax basics",
    lessons: "5 lessons",
    level: "Beginner OK",
    Icon: FileText,
    gradient: "linear-gradient(135deg, #1a6a2a, #28a040)",
  },
];

export function LearnPaths() {
  const [message, setMessage] = useState<string | null>(null);

  function handlePathClick(path: PathItem) {
    const related = path.relatedCategory
      ? ` Browse the ${path.relatedCategory} terms in the glossary below.`
      : "";

    setMessage(`${path.title}: Lessons coming soon.${related}`);
    document.getElementById("glossary")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="mb-20 border-t border-border/70 pt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-accent">PATHS</p>
          <h2 className="mt-2 text-3xl font-black tracking-normal text-ink">
            Learn by <span className="font-serif italic font-normal text-accent">topic</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-muted">
            Topic shelves organize the glossary into short learning routes.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {paths.map((path) => (
          <button
            key={path.title}
            type="button"
            onClick={() => handlePathClick(path)}
            className="min-h-44 rounded-[14px] border border-border/80 bg-surface-elevated p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_6px_20px_rgba(2,6,12,0.44)] transition hover:-translate-y-0.5 hover:border-accent/35"
          >
            <span
              className="grid h-10 w-10 place-items-center rounded-[10px] border border-white/10 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_24px_rgba(2,6,12,0.34)]"
              style={{ background: path.gradient }}
            >
              <path.Icon className="h-5 w-5" />
            </span>
            <span className="mt-5 block text-base font-black text-ink">
              {path.title}
            </span>
            <span className="mt-2 block text-xs font-semibold text-ink-muted">
              {path.lessons}
              <span className="text-gain"> - {path.level}</span>
            </span>
            <span className="mt-4 flex gap-2" aria-hidden>
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={index}
                  className="h-2.5 w-2.5 rounded-full border border-border-strong bg-surface-strong"
                />
              ))}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-4 rounded-xl border border-border bg-surface/70 px-3 py-2 text-xs font-semibold text-ink-subtle">
        Progress tracking - coming soon. Progress dots are decorative only.
      </p>
      {message ? (
        <p className="mt-3 rounded-xl border border-accent/18 bg-accent/8 px-3 py-2 text-xs font-semibold text-accent">
          {message}
        </p>
      ) : null}
    </section>
  );
}
