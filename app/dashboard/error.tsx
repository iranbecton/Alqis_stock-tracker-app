"use client";

import { useEffect } from "react";
import { AlqisErrorState } from "@/components/errors/alqis-error-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS dashboard error]", error);
    }
  }, [error]);

  return (
    <AlqisErrorState
      title="Dashboard could not be loaded."
      description="ALQIS could not assemble your dashboard state. Your saved tickers are preserved."
      retry={reset}
    />
  );
}
