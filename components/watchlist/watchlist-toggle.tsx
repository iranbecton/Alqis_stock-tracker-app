"use client";

import { useEffect, useRef, useState } from "react";
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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "remove" | null>(
    null
  );
  const feedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  async function updateWatchlist(nextSaved: boolean) {
    if (isPending) {
      return;
    }

    const previousSaved = isSaved;
    setIsSaved(nextSaved);
    setError(null);
    setFeedback(null);
    setIsPending(true);
    setPendingAction(nextSaved ? "save" : "remove");

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

      setFeedback(
        nextSaved ? "Saved to watchlist." : "Removed from watchlist."
      );
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setFeedback(null);
      }, 2400);
    } catch (requestError) {
      setIsSaved(previousSaved);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update watchlist."
      );
    } finally {
      setIsPending(false);
      setPendingAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 xl:items-end">
      <div className="flex flex-wrap gap-3 xl:justify-end">
        <Button
          type="button"
          variant={isSaved || pendingAction === "remove" ? "secondary" : "primary"}
          size="md"
          disabled={isPending}
          onClick={() => void updateWatchlist(!isSaved)}
          aria-pressed={isSaved}
        >
          {pendingAction === "remove" ? (
            <>
              <X className="h-4 w-4" />
              Removing...
            </>
          ) : isSaved ? (
            <>
              <Check className="h-4 w-4 text-gain" />
              Saved
            </>
          ) : (
            <>
              <Star className="h-4 w-4" />
              {pendingAction === "save" ? "Saving..." : "Save to Watchlist"}
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

      <div aria-live="polite" className="min-h-5">
        {error ? (
          <p className="max-w-[23rem] text-right text-body-sm text-loss">
            {error}
          </p>
        ) : feedback ? (
          <p className="max-w-[23rem] text-right text-body-sm text-ink-subtle">
            {feedback}
          </p>
        ) : null}
      </div>
    </div>
  );
}
