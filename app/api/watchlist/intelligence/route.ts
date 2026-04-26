import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichWatchlistItems } from "@/lib/watchlist/intelligence";
import type { WatchlistApiItem } from "@/lib/watchlist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bypassCache = searchParams.get("refresh") === "1";
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("id,ticker,company_name,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Intelligence route load failed", { error });
    }

    return NextResponse.json(
      {
        error: "Watchlist data unavailable. Your saved tickers are still preserved.",
      },
      { status: 500 }
    );
  }

  const savedItems: WatchlistApiItem[] = (data ?? []).map((item) => ({
    id: item.id,
    ticker: item.ticker,
    companyName: item.company_name,
    createdAt: item.created_at,
  }));
  const items = await enrichWatchlistItems(savedItems, { bypassCache });

  return NextResponse.json({
    items,
    refreshedAt: new Date().toISOString(),
  });
}
