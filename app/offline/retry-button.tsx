"use client";

export function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="rounded-md bg-[#2E7D74] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#25665f] focus:outline-none focus:ring-2 focus:ring-[#EDE0C8] focus:ring-offset-2 focus:ring-offset-[#13224A]"
    >
      Retry
    </button>
  );
}
