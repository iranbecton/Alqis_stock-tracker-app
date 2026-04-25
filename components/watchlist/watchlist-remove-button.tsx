"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type WatchlistRemoveButtonProps = {
  ticker: string;
};

export function WatchlistRemoveButton({ ticker }: WatchlistRemoveButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeTicker() {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ ticker }),
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Unable to remove ticker.");
      }

      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove ticker."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <Button
        type="button"
        variant="quiet"
        size="icon"
        disabled={isPending}
        onClick={() => void removeTicker()}
        aria-label={`Remove ${ticker} from watchlist`}
        className="h-10 w-10"
      >
        <X className="h-4 w-4" />
      </Button>
      {error ? (
        <span className="max-w-32 text-right text-xs leading-4 text-loss">
          {error}
        </span>
      ) : null}
    </div>
  );
}
