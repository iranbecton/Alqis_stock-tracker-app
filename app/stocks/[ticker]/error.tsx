"use client";

import { useEffect } from "react";
import { AlqisErrorState } from "@/components/errors/alqis-error-state";

export default function StockError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const errorMessage = error.message;
  const errorDigest = error.digest;

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS stock error]", {
        message: errorMessage,
        digest: errorDigest,
      });
    }
  }, [errorDigest, errorMessage]);

  return (
    <AlqisErrorState
      title="Market data could not be loaded."
      description="ALQIS hit an unexpected stock-page error. Retry the request, or return to the dashboard and search again."
      retry={reset}
    />
  );
}
