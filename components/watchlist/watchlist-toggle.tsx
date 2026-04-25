"use client";

import { useState } from "react";
import { Check, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type WatchlistToggleProps = {
  ticker: string;
  companyName: string;
  initialSaved: boolean;
};

export function WatchlistToggle({
  ticker,
  companyName,
  initialSaved,
}: WatchlistToggleProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function updateWatchlist(nextSaved: boolean) {
    if (isPending) {
      return;
    }

    const previousSaved = isSaved;
    setIsSaved(nextSaved);
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/watchlist", {
        method: nextSaved ? "POST" : "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ticker,
          companyName,
        }),
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Unable to update watchlist.");
      }
    } catch (requestError) {
      setIsSaved(previousSaved);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update watchlist."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 xl:items-end">
      <div className="flex flex-wrap gap-3 xl:justify-end">
        <Button
          type="button"
          variant={isSaved ? "secondary" : "primary"}
          size="md"
          disabled={isPending}
          onClick={() => void updateWatchlist(!isSaved)}
          aria-pressed={isSaved}
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4 text-gain" />
              Saved
            </>
          ) : (
            <>
              <Star className="h-4 w-4" />
              Save to Watchlist
            </>
          )}
        </Button>

        {isSaved ? (
          <Button
            type="button"
            variant="quiet"
            size="icon"
            disabled={isPending}
            onClick={() => void updateWatchlist(false)}
            aria-label={`Remove ${ticker} from watchlist`}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="max-w-[23rem] text-right text-body-sm text-loss">
          {error}
        </p>
      ) : null}
    </div>
  );
}
