import { toZonedTime } from "date-fns-tz";
import type { AlertRow } from "@/lib/alerts/types";

export type CronQuote = {
  c: number;
  o: number;
  pc: number;
};

export type EvaluationSummary = {
  event: "evaluation_cycle";
  tickersChecked: number;
  alertsFired: number;
  pendingResolved: number;
  pendingFailed: number;
  errors: number;
  durationMs: number;
};

const FULL_CLOSE_DATES = new Set([
  "2026-07-04",
  "2026-09-07",
  "2026-11-26",
  "2026-12-25",
]);
const EARLY_CLOSE_DATES = new Set(["2026-07-03", "2026-11-27"]);
const EASTERN_TIME_ZONE = "America/New_York";

export function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  return Boolean(secret && authorization === `Bearer ${secret}`);
}

export function isMarketOpen(now = new Date()) {
  const easternNow = toZonedTime(now, EASTERN_TIME_ZONE);
  const day = easternNow.getDay();
  const dateKey = getEasternDateKey(easternNow);

  if (day === 0 || day === 6 || FULL_CLOSE_DATES.has(dateKey)) {
    return false;
  }

  const minutes = easternNow.getHours() * 60 + easternNow.getMinutes();
  const openMinutes = 9 * 60 + 30;
  const closeMinutes = EARLY_CLOSE_DATES.has(dateKey) ? 13 * 60 : 16 * 60;

  return minutes >= openMinutes && minutes <= closeMinutes;
}

export function isMarketBusinessDay(now = new Date()) {
  const easternNow = toZonedTime(now, EASTERN_TIME_ZONE);
  const day = easternNow.getDay();
  const dateKey = getEasternDateKey(easternNow);

  return day !== 0 && day !== 6 && !FULL_CLOSE_DATES.has(dateKey);
}

export async function fetchCronQuote(ticker: string): Promise<{
  quote: CronQuote | null;
  error: boolean;
}> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      throw new Error("Missing FINNHUB_API_KEY.");
    }

    const url = new URL("https://finnhub.io/api/v1/quote");
    url.searchParams.set("symbol", ticker);
    url.searchParams.set("token", apiKey);

    const response = await fetch(url, { cache: "no-store" });

    if (response.status === 429) {
      console.log(JSON.stringify({ event: "rate_limit", ticker }));
      return { quote: null, error: true };
    }

    if (!response.ok) {
      console.log(JSON.stringify({ event: "quote_error", ticker }));
      return { quote: null, error: true };
    }

    const payload = (await response.json()) as Partial<CronQuote>;

    if (
      typeof payload.c !== "number" ||
      typeof payload.o !== "number" ||
      payload.c <= 0 ||
      payload.o <= 0
    ) {
      console.log(JSON.stringify({ event: "quote_error", ticker }));
      return { quote: null, error: true };
    }

    return {
      quote: {
        c: payload.c,
        o: payload.o,
        pc: typeof payload.pc === "number" ? payload.pc : 0,
      },
      error: false,
    };
  } catch {
    console.log(JSON.stringify({ event: "quote_error", ticker }));
    return { quote: null, error: true };
  }
}

export async function fetchQuotesWithDelay(tickers: string[]) {
  const results = new Map<string, CronQuote | null>();
  let errors = 0;

  for (let index = 0; index < tickers.length; index += 1) {
    if (index > 0) {
      await delay(200);
    }

    const ticker = tickers[index];
    const result = await fetchCronQuote(ticker);
    results.set(ticker, result.quote);

    if (result.error) {
      errors += 1;
    }
  }

  return { results, errors };
}

export function evaluateFiredAlertIds(
  alerts: AlertRow[],
  quotes: Map<string, CronQuote | null>
) {
  const firedIds: string[] = [];

  alerts.forEach((alert) => {
    if (alert.status !== "active" || alert.alert_type === "earnings_reminder") {
      return;
    }

    const quote = quotes.get(alert.ticker);

    if (!quote) {
      return;
    }

    if (alert.alert_type === "session_move") {
      const threshold = Number(alert.threshold_pct);
      const movePct = ((quote.c - quote.o) / quote.o) * 100;

      if (
        (alert.direction === "up" && movePct >= threshold) ||
        (alert.direction === "down" && movePct <= -threshold) ||
        (alert.direction === "either" && Math.abs(movePct) >= threshold)
      ) {
        firedIds.push(alert.id);
      }
    }

    if (alert.alert_type === "price_level") {
      const threshold = Number(alert.threshold_price);

      if (
        (alert.direction === "above" && quote.c >= threshold) ||
        (alert.direction === "below" && quote.c <= threshold)
      ) {
        firedIds.push(alert.id);
      }
    }
  });

  return firedIds;
}

export function createEvaluationSummary({
  startedAt,
  tickersChecked,
  alertsFired,
  pendingResolved,
  pendingFailed,
  errors,
}: {
  startedAt: number;
  tickersChecked: number;
  alertsFired: number;
  pendingResolved: number;
  pendingFailed: number;
  errors: number;
}): EvaluationSummary {
  return {
    event: "evaluation_cycle",
    tickersChecked,
    alertsFired,
    pendingResolved,
    pendingFailed,
    errors,
    durationMs: Date.now() - startedAt,
  };
}

export function formatAfterHoursNote(ticker: string, pct: number) {
  const sign = pct > 0 ? "+" : "";

  return `${ticker} moved ${sign}${pct.toFixed(1)}% after hours — alert threshold not evaluated outside market hours.`;
}

function getEasternDateKey(easternDate: Date) {
  const year = easternDate.getFullYear();
  const month = String(easternDate.getMonth() + 1).padStart(2, "0");
  const day = String(easternDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
