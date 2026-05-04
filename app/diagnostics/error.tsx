"use client";

import { useEffect } from "react";
import { AlqisErrorState } from "@/components/errors/alqis-error-state";

export default function DiagnosticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS diagnostics error]", error);
    }
  }, [error]);

  return (
    <AlqisErrorState
      title="Diagnostics could not be loaded."
      description="The internal health view is temporarily unavailable. Retry the checks or return to the dashboard."
      retry={reset}
    />
  );
}
