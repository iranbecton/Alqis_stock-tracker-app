/* eslint-disable @next/next/no-img-element */
import { RetryButton } from "./retry-button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh bg-[#13224A] px-6 py-8 text-center">
      <section className="m-auto flex max-w-md flex-col items-center">
        <img src="/icons/icon-192.png" alt="" width={64} height={64} className="h-16 w-16" />
        <p className="mt-5 text-lg font-semibold tracking-[0.24em] text-[#EDE0C8]">ALQIS</p>
        <h1 className="mt-8 text-4xl font-semibold text-white">You&apos;re offline</h1>
        <p className="mt-4 text-base leading-7 text-[#EDE0C8]">
          ALQIS needs a live connection to deliver market intelligence. Market data cannot be shown
          without network access.
        </p>
        <div className="mt-8">
          <RetryButton />
        </div>
        <p className="mt-10 text-xs leading-6 text-[#EDE0C8]/80">
          ALQIS is not a financial adviser. This is not financial advice.
        </p>
      </section>
    </main>
  );
}
