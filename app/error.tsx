"use client";

import { useEffect } from "react";
import { AlqisErrorState } from "@/components/errors/alqis-error-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS app error]", error);
    }
  }, [error]);

  return (
    <AlqisErrorState
      title="ALQIS could not load this view."
      description="An unexpected application error occurred. Retry the request, or return to the dashboard."
      retry={reset}
    />
  );
}
