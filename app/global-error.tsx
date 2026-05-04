"use client";

import { useEffect } from "react";
import "@/app/globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS global error]", error);
    }
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh bg-bg text-ink font-sans antialiased">
        <main className="flex min-h-dvh items-center justify-center bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)] px-4 py-8">
          <section className="w-full max-w-xl rounded-[var(--radius-xl)] border border-warn/18 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_88%,var(--warning)_7%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-ai)_4%)_100%)] p-6 shadow-elevation-3">
            <p className="section-kicker text-warn">ALQIS</p>
            <h1 className="mt-3 font-serif text-[2.2rem] leading-tight text-ink">
              The app could not recover this view.
            </h1>
            <p className="mt-3 text-body text-ink-muted">
              Retry the request. If the issue continues, return to the dashboard after refreshing.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-accent px-5 text-sm font-medium text-bg"
            >
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
