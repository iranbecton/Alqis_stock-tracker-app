"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

export const glossarySearchEventName = "alqis-glossary-search";

export function LearnNavSearch() {
  const [query, setQuery] = useState("");

  function scrollToGlossary(searchQuery = query) {
    const trimmedQuery = searchQuery.trim();

    window.dispatchEvent(
      new CustomEvent(glossarySearchEventName, { detail: { query: trimmedQuery } }),
    );
    document.getElementById("glossary")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    scrollToGlossary();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="lg:ml-auto flex min-h-9 w-full max-w-sm items-center gap-2 rounded-[0.75rem] border border-border bg-surface/70 px-3 text-xs font-semibold text-ink-muted transition focus-within:border-accent/35 lg:w-auto"
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-accent" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search the encyclopedia"
        placeholder="Search the encyclopedia"
        className="min-h-9 min-w-0 flex-1 bg-transparent text-xs font-semibold text-ink outline-none placeholder:text-ink-muted lg:w-56"
      />
    </form>
  );
}
