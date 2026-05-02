import { NextResponse } from "next/server";
import {
  type StockExplanationRow,
  toExplanationHistoryItem,
} from "@/lib/explanations/types";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get("ticker");
  const ticker = tickerParam ? normalizeTicker(tickerParam) : null;
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? DEFAULT_LIMIT), 1),
    MAX_LIMIT
  );

  if (ticker && !isValidTicker(ticker)) {
    return NextResponse.json({ error: "Invalid ticker symbol." }, { status: 400 });
  }

  let query = supabase
    .from("stock_explanations")
    .select(
      "id,ticker,company_name,timeframe,summary,confidence_score,confidence_band,confidence_label,source_count,key_factors,counterevidence,generated_at,created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ticker) {
    query = query.eq("ticker", ticker);
  }

  const { data, error } = await query;

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS explanations] History select failed", { error });
    }

    return NextResponse.json(
      { error: "Unable to load explanation history right now." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    items: ((data ?? []) as StockExplanationRow[]).map(toExplanationHistoryItem),
  });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let id = "";

  try {
    const body = (await request.json()) as { id?: unknown };
    id = typeof body.id === "string" ? body.id : "";
  } catch {
    return NextResponse.json({ error: "Body must include an id." }, { status: 400 });
  }

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid explanation id." }, { status: 400 });
  }

  const { error } = await supabase
    .from("stock_explanations")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS explanations] History delete failed", { error });
    }

    return NextResponse.json(
      { error: "Unable to delete explanation history item." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id,
    removed: true,
  });
}
