"use client";

import { useEffect } from "react";
import { AlqisErrorState } from "@/components/errors/alqis-error-state";

export default function LearnError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS learn error]", error);
    }
  }, [error]);

  return (
    <AlqisErrorState
      title="Investment Encyclopedia could not be loaded."
      description="ALQIS could not render the education library. Retry the page, or return to the dashboard."
      retry={reset}
    />
  );
}
