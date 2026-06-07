import { NextResponse } from "next/server";
import type { AlertRow } from "@/lib/alerts/types";
import {
  createEvaluationSummary,
  evaluateFiredAlertIds,
  fetchQuotesWithDelay,
  isAuthorizedCronRequest,
  isMarketOpen,
} from "@/lib/alerts/cron";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALERT_COLUMNS =
  "id,user_id,ticker,alert_type,direction,threshold_pct,threshold_price,is_enabled,status,last_triggered_at,after_hours_note,created_at,updated_at";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  if (!isMarketOpen()) {
    return NextResponse.json({ skipped: true, reason: "market closed" });
  }

  const supabase = createServiceRoleClient();

  await Promise.all([
    supabase
      .from("alerts")
      .update({ after_hours_note: null, updated_at: new Date().toISOString() })
      .not("after_hours_note", "is", null),
    supabase
      .from("alerts")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("status", "fired")
      .eq("alert_type", "session_move"),
  ]);

  const { data: tickerRows, error: tickerError } = await supabase
    .from("alerts")
    .select("ticker")
    .in("status", ["active", "pending"])
    .eq("is_enabled", true);

  if (tickerError) {
    return NextResponse.json(
      { error: "Alert evaluation unavailable." },
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
  const successfullyQuotedTickers = [...quotes.entries()]
    .filter(([, quote]) => Boolean(quote))
    .map(([ticker]) => ticker);
  const { data: alertRows, error: alertsError } =
    successfullyQuotedTickers.length > 0
      ? await supabase
          .from("alerts")
          .select(ALERT_COLUMNS)
          .in("ticker", successfullyQuotedTickers)
          .in("status", ["active", "pending"])
          .eq("is_enabled", true)
      : { data: [], error: null };

  if (alertsError) {
    return NextResponse.json(
      { error: "Alert evaluation unavailable." },
      { status: 500 }
    );
  }

  const firedIds = evaluateFiredAlertIds((alertRows ?? []) as AlertRow[], quotes);
  const alertsFired = await writeFiredAlerts(supabase, firedIds);
  const pendingResolved = await resolvePendingAlerts(
    supabase,
    successfullyQuotedTickers
  );
  const pendingFailed = await failStalePendingAlerts(
    supabase,
    successfullyQuotedTickers
  );
  const summary = createEvaluationSummary({
    startedAt,
    tickersChecked: tickers.length,
    alertsFired,
    pendingResolved,
    pendingFailed,
    errors,
  });

  console.log(JSON.stringify(summary));

  return NextResponse.json(summary);
}

async function writeFiredAlerts(
  supabase: ReturnType<typeof createServiceRoleClient>,
  firedIds: string[]
) {
  if (!firedIds.length) {
    return 0;
  }

  const { data } = await supabase
    .from("alerts")
    .update({
      status: "fired",
      last_triggered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", firedIds)
    .select("id");

  return data?.length ?? 0;
}

async function resolvePendingAlerts(
  supabase: ReturnType<typeof createServiceRoleClient>,
  tickers: string[]
) {
  if (!tickers.length) {
    return 0;
  }

  const { data } = await supabase
    .from("alerts")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "pending")
    .eq("is_enabled", true)
    .in("ticker", tickers)
    .select("id");

  return data?.length ?? 0;
}

async function failStalePendingAlerts(
  supabase: ReturnType<typeof createServiceRoleClient>,
  successfullyQuotedTickers: string[]
) {
  const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let query = supabase
    .from("alerts")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "pending")
    .eq("is_enabled", true)
    .lt("created_at", staleCutoff);

  if (successfullyQuotedTickers.length) {
    query = query.not("ticker", "in", `(${successfullyQuotedTickers.join(",")})`);
  }

  const { data } = await query.select("id");

  return data?.length ?? 0;
}
