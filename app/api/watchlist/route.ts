import { NextResponse } from "next/server";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import { createClient } from "@/lib/supabase/server";
import type { WatchlistApiItem, WatchlistApiResponse } from "@/lib/watchlist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WatchlistRow = {
  id: string;
  ticker: string;
  company_name: string | null;
  created_at: string;
};

function toApiItem(row: WatchlistRow): WatchlistApiItem {
  return {
    id: row.id,
    ticker: row.ticker,
    companyName: row.company_name,
    createdAt: row.created_at,
  };
}

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

async function parseWatchlistBody(request: Request) {
  try {
    const body = (await request.json()) as {
      ticker?: unknown;
      companyName?: unknown;
    };
    const ticker = typeof body.ticker === "string" ? normalizeTicker(body.ticker) : "";
    const companyName =
      typeof body.companyName === "string" && body.companyName.trim()
        ? body.companyName.trim()
        : null;

    if (!ticker || !isValidTicker(ticker)) {
      return null;
    }

    return { ticker, companyName };
  } catch {
    return null;
  }
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .select("id,ticker,company_name,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Select failed", { error });
    }

    return NextResponse.json(
      { error: "Unable to load watchlist right now." },
      { status: 500 }
    );
  }

  return NextResponse.json<WatchlistApiResponse>({
    items: ((data ?? []) as WatchlistRow[]).map(toApiItem),
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = await parseWatchlistBody(request);

  if (!parsed) {
    return NextResponse.json(
      { error: "Body must include a valid ticker." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .upsert(
      {
        user_id: user.id,
        ticker: parsed.ticker,
        company_name: parsed.companyName,
      },
      {
        onConflict: "user_id,ticker",
      }
    )
    .select("id,ticker,company_name,created_at")
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Upsert failed", { error });
    }

    return NextResponse.json(
      { error: "Unable to save ticker to watchlist." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    item: toApiItem(data as WatchlistRow),
  });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = await parseWatchlistBody(request);

  if (!parsed) {
    return NextResponse.json(
      { error: "Body must include a valid ticker." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("user_id", user.id)
    .eq("ticker", parsed.ticker);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Delete failed", { error });
    }

    return NextResponse.json(
      { error: "Unable to remove ticker from watchlist." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ticker: parsed.ticker,
    removed: true,
  });
}
