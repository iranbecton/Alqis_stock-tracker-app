"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { glossarySearchEventName } from "@/components/education/learn-nav-search";
import { SearchInput } from "@/components/ui/input";
import {
  glossaryItems,
  type GlossaryCategory,
  type GlossaryLevel,
} from "@/lib/education/glossary";

type CategoryFilter = "all" | GlossaryCategory;
type LevelFilter = "all" | GlossaryLevel;

const categoryOptions: Array<{
  value: CategoryFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "price-and-data", label: "Price & Data" },
  { value: "chart-and-technicals", label: "Charts" },
  { value: "fundamentals", label: "Fundamentals" },
  { value: "earnings", label: "Earnings" },
  { value: "market-structure", label: "Market Structure" },
  { value: "alqis-concepts", label: "ALQIS Concepts" },
  { value: "macro", label: "Macro" },
];

const levelOptions: Array<{
  value: LevelFilter;
  label: string;
}> = [
  { value: "all", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
];

const categoryLabelByValue: Record<GlossaryCategory, string> = {
  "price-and-data": "Price & Data",
  "chart-and-technicals": "Charts",
  fundamentals: "Fundamentals",
  earnings: "Earnings",
  "market-structure": "Market Structure",
  "alqis-concepts": "ALQIS Concepts",
  macro: "Macro",
};

const levelLabelByValue: Record<GlossaryLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
};

const defaultVisibleTerms = 9;

export function GlossaryBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [expanded, setExpanded] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = glossaryItems.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const matchesLevel = level === "all" || item.level === level;
    const matchesSearch = normalizedQuery
      ? [
          item.term,
          item.shortDefinition,
          item.plainEnglish,
          item.whyItMatters,
          item.caution ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      : true;

    return matchesCategory && matchesLevel && matchesSearch;
  });
  const hasActiveFilters =
    category !== "all" || level !== "all" || normalizedQuery.length > 0;
  const shouldCollapse = !hasActiveFilters && !expanded;
  const visibleItems = shouldCollapse
    ? filteredItems.slice(0, defaultVisibleTerms)
    : filteredItems;
  const canToggleTerms = !hasActiveFilters && filteredItems.length > defaultVisibleTerms;

  useEffect(() => {
    function handleNavSearch(event: Event) {
      const searchEvent = event as CustomEvent<{ query?: string }>;
      const nextQuery = searchEvent.detail?.query ?? "";

      if (nextQuery) {
        setQuery(nextQuery);
      }

      document.getElementById("glossary-search")?.focus();
    }

    window.addEventListener(glossarySearchEventName, handleNavSearch);

    return () => {
      window.removeEventListener(glossarySearchEventName, handleNavSearch);
    };
  }, []);

  return (
    <section className="space-y-5">
      <div className="rounded-[var(--radius-xl)] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_84%,var(--accent-ai)_8%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_4%)_100%)] p-4 sm:p-5">
        <div className="space-y-3">
          <div>
            <p className="section-kicker text-ink-muted">Category</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {categoryOptions.map((option) => (
                <FilterButton
                  key={option.value}
                  active={category === option.value}
                  onClick={() => setCategory(option.value)}
                >
                  {option.label}
                </FilterButton>
              ))}
            </div>
          </div>

          <div>
            <p className="section-kicker text-ink-muted">Level</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {levelOptions.map((option) => (
                <FilterButton
                  key={option.value}
                  active={level === option.value}
                  onClick={() => setLevel(option.value)}
                >
                  {option.label}
                </FilterButton>
              ))}
            </div>
          </div>
        </div>

        <label htmlFor="glossary-search" className="section-kicker block text-ink-muted">
          Search encyclopedia terms
        </label>
        <div className="mt-3 flex items-center gap-3">
          <Search className="hidden h-5 w-5 text-accent-secondary sm:block" />
          <SearchInput
            id="glossary-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search terms like confidence, guidance, or volume"
            size="lg"
          />
        </div>
        <p className="mt-2 text-body-sm text-ink-subtle">
          {hasActiveFilters
            ? `Showing ${filteredItems.length} of ${glossaryItems.length} terms`
            : expanded
              ? `${glossaryItems.length} terms available`
              : `Showing ${visibleItems.length} of ${glossaryItems.length} terms`}
        </p>
      </div>

      {filteredItems.length ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="rounded-[var(--radius-xl)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--surface)_18%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
              >
                <p className="section-kicker text-accent-ai">ALQIS term</p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-ink">
                  {item.term}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-accent-secondary/18 bg-accent-secondary/8 px-2 py-1 text-[0.7rem] font-semibold text-accent-secondary">
                    {categoryLabelByValue[item.category]}
                  </span>
                  <span
                    className={
                      item.level === "beginner"
                        ? "rounded-full border border-gain/18 bg-gain/10 px-2 py-1 text-[0.7rem] font-semibold text-gain"
                        : "rounded-full border border-warn/18 bg-warn-bg/22 px-2 py-1 text-[0.7rem] font-semibold text-warn"
                    }
                  >
                    {levelLabelByValue[item.level]}
                  </span>
                </div>
                <p className="mt-3 text-body-sm font-medium leading-6 text-ink">
                  {item.shortDefinition}
                </p>
                <p className="mt-3 text-body-sm leading-6 text-ink-muted">
                  {item.plainEnglish}
                </p>
                <div className="mt-4 rounded-[var(--radius-md)] border border-border/60 bg-surface/42 px-3 py-3">
                  <p className="section-kicker text-ink-subtle">Why it matters</p>
                  <p className="mt-2 text-body-sm leading-6 text-ink-muted">
                    {item.whyItMatters}
                  </p>
                </div>
                {item.caution ? (
                  <div className="mt-3 rounded-[var(--radius-md)] border border-warn/18 bg-warn-bg/18 px-3 py-3">
                    <p className="section-kicker text-warn">Caution</p>
                    <p className="mt-2 text-body-sm leading-6 text-warn">
                      {item.caution}
                    </p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          {canToggleTerms ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="min-h-10 rounded-full border border-border/70 bg-surface/70 px-4 text-sm font-black text-ink-muted transition hover:border-accent-secondary/35 hover:text-ink"
              >
                {expanded ? "Show less" : `See all ${glossaryItems.length} terms`}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-border/70 bg-surface/42 px-5 py-8 text-center">
          <p className="text-sm font-medium text-ink">No matching term found.</p>
          <p className="mt-2 text-body-sm text-ink-muted">
            Try a broader market term or clear the search.
          </p>
        </div>
      )}
    </section>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "min-h-9 whitespace-nowrap rounded-full border border-accent-secondary bg-accent-secondary/10 px-3 text-sm font-semibold text-accent-secondary"
          : "min-h-9 whitespace-nowrap rounded-full border border-border/70 bg-surface/42 px-3 text-sm font-semibold text-ink-muted transition hover:border-accent-secondary/35 hover:text-ink"
      }
    >
      {children}
    </button>
  );
}
