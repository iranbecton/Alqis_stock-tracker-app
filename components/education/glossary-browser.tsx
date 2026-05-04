"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { SearchInput } from "@/components/ui/input";
import { glossaryItems } from "@/lib/education/glossary";

export function GlossaryBrowser() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? glossaryItems.filter((item) =>
        [
          item.term,
          item.shortDefinition,
          item.plainEnglish,
          item.whyItMatters,
          item.caution ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : glossaryItems;

  return (
    <section className="space-y-5">
      <div className="rounded-[var(--radius-xl)] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_84%,var(--accent-ai)_8%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_4%)_100%)] p-4 sm:p-5">
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
          {filteredItems.length} term{filteredItems.length === 1 ? "" : "s"} available.
        </p>
      </div>

      {filteredItems.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-[var(--radius-xl)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--surface)_18%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
            >
              <p className="section-kicker text-accent-ai">ALQIS term</p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-ink">
                {item.term}
              </h2>
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
