import { NextResponse } from "next/server";
import {
  fetchQuotesWithDelay,
  formatAfterHoursNote,
  isAuthorizedCronRequest,
  isMarketBusinessDay,
} from "@/lib/alerts/cron";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  if (!isMarketBusinessDay()) {
    return NextResponse.json({ skipped: true, reason: "market closed" });
  }

  const supabase = createServiceRoleClient();
  const { data: tickerRows, error } = await supabase
    .from("alerts")
    .select("ticker")
    .in("status", ["active", "fired"])
    .eq("is_enabled", true);

  if (error) {
    return NextResponse.json(
      { error: "After-hours notes unavailable." },
      { status: 500 }
    );
  }

  const tickers = [
    ...new Set((tickerRows ?? []).map((row) => String(row.ticker).toUpperCase())),
  ];

  if (!tickers.length) {
    return NextResponse.json({ skipped: true, reason: "no active alerts" });
  }

  const { results: quotes, errors } = await fetchQuotesWithDelay(tickers);
  const noteUpdates = [...quotes.entries()]
    .map(([ticker, quote]) => {
      if (!quote || quote.pc <= 0) {
        return null;
      }

      const afterHoursPct = ((quote.c - quote.pc) / quote.pc) * 100;

      if (Math.abs(afterHoursPct) < 1) {
        return null;
      }

      return {
        ticker,
        note: formatAfterHoursNote(ticker, afterHoursPct),
      };
    })
    .filter((item): item is { ticker: string; note: string } => Boolean(item));
  let notesWritten = 0;

  if (noteUpdates.length) {
    const { data } = await supabase.rpc("update_alert_after_hours_notes", {
      note_updates: noteUpdates,
    });
    notesWritten = typeof data === "number" ? data : 0;
  }

  const summary = {
    event: "after_hours_notes_cycle",
    tickersChecked: tickers.length,
    notesWritten,
    errors,
    durationMs: Date.now() - startedAt,
  };

  console.log(JSON.stringify(summary));

  return NextResponse.json(summary);
}
