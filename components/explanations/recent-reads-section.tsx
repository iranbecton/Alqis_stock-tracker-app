import Link from "next/link";
import { Clock3 } from "lucide-react";
import type { ExplanationHistoryItem } from "@/lib/explanations/types";

type RecentReadsSectionProps = {
  items: ExplanationHistoryItem[];
  title?: string;
  description?: string;
  compact?: boolean;
  limit?: number;
};

export function RecentReadsSection({
  items,
  limit,
}: RecentReadsSectionProps) {
  const visibleItems = limit ? items.slice(0, limit) : items;

  if (!visibleItems.length) {
    return null;
  }

  return (
    <section className="rounded-[1.05rem] border border-[rgba(108,155,205,0.24)] bg-[radial-gradient(circle_at_8%_0%,rgba(117,231,220,0.055),transparent_30%),linear-gradient(180deg,#102032_0%,#07111d_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_8px_22px_rgba(0,0,0,0.28)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <p className="section-kicker flex shrink-0 items-center gap-2 text-[#86b7d4]">
          <Clock3 className="h-3.5 w-3.5 text-[var(--accent)]" />
          RECENT
        </p>
        <div className="scrollbar-dark -mx-1 flex gap-2 overflow-x-auto px-1">
          {visibleItems.map((item) => (
            <Link
              key={item.id}
              href={`/stocks/${item.ticker}`}
              className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-[rgba(117,231,220,0.24)] bg-[rgba(7,17,30,0.66)] px-3 text-[0.78rem] font-semibold text-[#d9e9ff] transition hover:border-[rgba(117,231,220,0.45)] hover:text-[#f4f8ff]"
            >
              <span>{item.ticker}</span>
              {item.confidenceLabel ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-[var(--accent)]" aria-hidden />
                  <span className="text-[#a7b7cc]">{item.confidenceLabel}</span>
                </>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
