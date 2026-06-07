import { useEffect, useState, type FormEvent } from "react";
import { Bell, CalendarDays, Check, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Alert } from "@/lib/alerts/types";
import type { PortfolioHoldingsResponse } from "@/lib/portfolio/types";
import type { WatchlistApiResponse } from "@/lib/watchlist/types";
import { cn } from "@/lib/utils";

type AlertModalProps = {
  initialTicker?: string;
  initialCompanyName?: string | null;
  onClose: () => void;
  onSaved?: (alert: Alert) => void;
};

type AlertKind = "session_move" | "price_level";
type EarningsItem = {
  ticker: string;
  companyName: string | null;
  date: string;
};

const SESSION_THRESHOLDS = [2, 5, 10, 15, 20];
const FALLBACK_TICKERS = ["AAPL", "MSFT", "NVDA", "AMZN", "META"];

export function AlertModal({
  initialTicker,
  initialCompanyName,
  onClose,
  onSaved,
}: AlertModalProps) {
  const lockedTicker = initialTicker?.trim().toUpperCase();
  const [ticker, setTicker] = useState(lockedTicker ?? "");
  const [alertKind, setAlertKind] = useState<AlertKind>("session_move");
  const [sessionDirection, setSessionDirection] = useState<"up" | "down" | "either">("either");
  const [priceDirection, setPriceDirection] = useState<"above" | "below">("above");
  const [thresholdPct, setThresholdPct] = useState("5");
  const [selectedChip, setSelectedChip] = useState(5);
  const [thresholdPrice, setThresholdPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [loadingEarnings, setLoadingEarnings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const normalizedTicker = ticker.trim().toUpperCase();
  const canSave = /^[A-Z][A-Z0-9.]{0,4}$/.test(normalizedTicker);

  useEffect(() => {
    if (!canSave) {
      setCurrentPrice(null);
      return;
    }

    let isActive = true;

    async function loadQuote() {
      try {
        const response = await fetch(`/api/stocks/${normalizedTicker}/quote`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (isActive && response.ok && typeof payload.price === "number") {
          setCurrentPrice(payload.price);
        } else if (isActive) {
          setCurrentPrice(null);
        }
      } catch {
        if (isActive) {
          setCurrentPrice(null);
        }
      }
    }

    void loadQuote();

    return () => {
      isActive = false;
    };
  }, [canSave, normalizedTicker]);

  useEffect(() => {
    let isActive = true;

    async function loadEarningsWatch() {
      setLoadingEarnings(true);

      try {
        const candidates = await getEarningsCandidates();
        const items = await Promise.all(
          candidates.map(async (candidate) => {
            try {
              const response = await fetch(`/api/stocks/${candidate.ticker}/earnings`);
              const payload = await response.json();

              if (!response.ok || !payload.date) {
                return null;
              }

              return {
                ticker: candidate.ticker,
                companyName: candidate.companyName,
                date: payload.date as string,
              };
            } catch {
              return null;
            }
          })
        );

        if (isActive) {
          setEarnings(items.filter((item): item is EarningsItem => Boolean(item)).slice(0, 6));
        }
      } finally {
        if (isActive) {
          setLoadingEarnings(false);
        }
      }
    }

    void loadEarningsWatch();

    return () => {
      isActive = false;
    };
  }, []);

  async function submitAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const body =
      alertKind === "session_move"
        ? {
            ticker: normalizedTicker,
            alert_type: "session_move",
            direction: sessionDirection,
            threshold_pct: Number(thresholdPct),
          }
        : {
            ticker: normalizedTicker,
            alert_type: "price_level",
            direction: priceDirection,
            threshold_price: Number(thresholdPrice),
          };

    if (!canSave) {
      setError("Ticker must be a valid symbol.");
      return;
    }

    if (alertKind === "session_move" && !isValidPct(thresholdPct)) {
      setError("Session move threshold must be 1 to 50.");
      return;
    }

    if (alertKind === "price_level" && Number(thresholdPrice) <= 0) {
      setError("Price level must be greater than 0.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to save alert.");
      }

      setSuccess("Alert saved. Watching once market data loads.");
      onSaved?.(payload.alert as Alert);
      setTimeout(onClose, 650);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save alert.");
    } finally {
      setSaving(false);
    }
  }

  const priceHint =
    typeof currentPrice === "number"
      ? `Current: ${formatCurrency(currentPrice)}`
      : "Current price unavailable \u2014 alert activates when market data loads.";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/72 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={submitAlert}
        className="w-full max-w-3xl rounded-[1.1rem] border border-[#2f72d5]/28 bg-[#0D1B24] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-kicker text-[#72c7be]">Alert setup</p>
            <h2 className="mt-1 font-serif text-2xl text-[#F4EEE2]">Set an Alert</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-[#F4EEE2]/70 hover:text-[#F4EEE2]"
            aria-label="Close alert setup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-5">
          <section>
            <p className="section-kicker text-[#7891ad]">Ticker</p>
            {lockedTicker ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#72c7be]/24 bg-[#72c7be]/10 px-3 py-2 text-sm font-black text-[#F4EEE2]">
                {lockedTicker}
                {initialCompanyName ? (
                  <span className="font-medium text-[#a9bad0]">{initialCompanyName}</span>
                ) : null}
              </div>
            ) : (
              <input
                value={ticker}
                onChange={(event) => setTicker(event.currentTarget.value.toUpperCase())}
                className="mt-2 min-h-11 w-full rounded-[0.85rem] border border-[#2f72d5]/24 bg-[#07111f]/78 px-3 text-[#F4EEE2] outline-none focus:border-[#72c7be]/52"
                placeholder="NVDA"
              />
            )}
          </section>

          <section>
            <p className="section-kicker text-[#7891ad]">Alert Type</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <ChoiceButton
                active={alertKind === "session_move"}
                label="Session Move"
                onClick={() => setAlertKind("session_move")}
              />
              <ChoiceButton
                active={alertKind === "price_level"}
                label="Price Level"
                onClick={() => setAlertKind("price_level")}
              />
            </div>
          </section>

          {alertKind === "session_move" ? (
            <section className="rounded-[1rem] border border-[#2f72d5]/20 bg-[#07111f]/52 p-4">
              <p className="section-kicker text-[#72c7be]">Config Panel</p>
              <div className="mt-3 grid gap-4">
                <SegmentedControl
                  label="Direction"
                  value={sessionDirection}
                  options={[
                    ["up", "Up"],
                    ["down", "Down"],
                    ["either", "Either"],
                  ]}
                  onChange={(value) => setSessionDirection(value as typeof sessionDirection)}
                />
                <div>
                  <p className="text-sm font-semibold text-[#c7d5e8]">Threshold</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SESSION_THRESHOLDS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSelectedChip(value);
                          setThresholdPct(String(value));
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm font-black",
                          selectedChip === value
                            ? "border-[#72c7be]/46 bg-[#72c7be]/16 text-[#72c7be]"
                            : "border-[#2f72d5]/24 bg-[#07111f]/60 text-[#a9bad0]"
                        )}
                      >
                        {value}%
                      </button>
                    ))}
                    <input
                      value={thresholdPct}
                      onChange={(event) => {
                        setThresholdPct(event.currentTarget.value);
                        setSelectedChip(0);
                      }}
                      className="h-9 w-24 rounded-full border border-[#2f72d5]/24 bg-[#07111f]/78 px-3 text-sm text-[#F4EEE2] outline-none focus:border-[#72c7be]/52"
                      inputMode="decimal"
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-[1rem] border border-[#2f72d5]/20 bg-[#07111f]/52 p-4">
              <p className="section-kicker text-[#72c7be]">Config Panel</p>
              <div className="mt-3 grid gap-4">
                <SegmentedControl
                  label="Direction"
                  value={priceDirection}
                  options={[
                    ["above", "Above"],
                    ["below", "Below"],
                  ]}
                  onChange={(value) => setPriceDirection(value as typeof priceDirection)}
                />
                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-[#c7d5e8]">Price</span>
                  <input
                    value={thresholdPrice}
                    type="number"
                    min="0"
                    step="0.01"
                    onChange={(event) => setThresholdPrice(event.currentTarget.value)}
                    className="min-h-11 rounded-[0.85rem] border border-[#2f72d5]/24 bg-[#07111f]/78 px-3 text-[#F4EEE2] outline-none focus:border-[#72c7be]/52"
                  />
                  <span className="text-sm text-[#7891ad]">{priceHint}</span>
                </label>
              </div>
            </section>
          )}

          <EarningsWatchSection
            items={earnings}
            loading={loadingEarnings}
            onSaved={onSaved}
          />

          <p className="rounded-[0.85rem] border border-[#72c7be]/16 bg-[#72c7be]/8 px-3 py-2 text-sm text-[#F4EEE2]">
            Alerts are for monitoring only and do not constitute investment advice. ALQIS cannot place trades on your behalf.
          </p>
        </div>

        {error ? (
          <p className="mt-4 rounded-[0.85rem] border border-[#c9877a]/24 bg-[#c9877a]/10 px-3 py-2 text-sm text-[#f1c3bb]">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-[0.85rem] border border-[#63cfa8]/24 bg-[#63cfa8]/10 px-3 py-2 text-sm text-[#bcebd9]" aria-live="polite">
            {success}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#72c7be] text-[#070F14] hover:bg-[#8ed8d0]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Save alert
          </Button>
        </div>
      </form>
    </div>
  );
}

function ChoiceButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-[0.85rem] border px-3 text-left text-sm font-black",
        active
          ? "border-[#72c7be]/46 bg-[#72c7be]/14 text-[#72c7be]"
          : "border-[#2f72d5]/24 bg-[#07111f]/58 text-[#a9bad0]"
      )}
    >
      {label}
    </button>
  );
}

function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#c7d5e8]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-black",
              value === optionValue
                ? "border-[#72c7be]/46 bg-[#72c7be]/16 text-[#72c7be]"
                : "border-[#2f72d5]/24 bg-[#07111f]/60 text-[#a9bad0]"
            )}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function EarningsWatchSection({
  items,
  loading,
  onSaved,
}: {
  items: EarningsItem[];
  loading: boolean;
  onSaved?: (alert: Alert) => void;
}) {
  return (
    <section className="rounded-[1rem] border border-[#2f72d5]/20 bg-[#07111f]/52 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="section-kicker text-[#72c7be]">Earnings Watch</p>
        <Badge variant="outline" size="sm" className="border-[#7da6d9]/24 bg-[#7da6d9]/10 text-[#9ec3f0]">
          In-app reminders soon
        </Badge>
      </div>
      {loading ? (
        <div className="mt-3 grid gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-14 animate-pulse rounded-[0.85rem] bg-white/[0.04]" />
          ))}
        </div>
      ) : items.length ? (
        <div className="mt-3 grid gap-2">
          {items.map((item) => (
            <EarningsReminderRow
              key={`${item.ticker}-${item.date}`}
              item={item}
              onSaved={onSaved}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#7891ad]">
          No upcoming earnings dates found for saved tickers.
        </p>
      )}
    </section>
  );
}

function EarningsReminderRow({
  item,
  onSaved,
}: {
  item: EarningsItem;
  onSaved?: (alert: Alert) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveReminder() {
    if (saved || saving) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ticker: item.ticker,
          alert_type: "earnings_reminder",
        }),
      });
      const payload = await response.json();

      if (response.ok) {
        setSaved(true);
        onSaved?.(payload.alert as Alert);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-[0.85rem] border border-[#2f72d5]/16 bg-[#0D1B24]/72 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <div className="grid h-10 w-10 place-items-center rounded-[0.65rem] border border-[#72c7be]/20 bg-[#72c7be]/10 text-sm font-black text-[#F4EEE2]">
        {item.ticker.slice(0, 2)}
      </div>
      <div className="min-w-0">
        <p className="font-black text-[#F4EEE2]">{item.ticker}</p>
        <p className="truncate text-sm text-[#a9bad0]">
          {item.companyName ?? "Company"} / {formatDate(item.date)} / {daysUntil(item.date)}
        </p>
      </div>
      <Button
        type="button"
        variant={saved ? "secondary" : "quiet"}
        size="sm"
        className="border border-[#72c7be]/24"
        disabled={saved || saving}
        onClick={() => void saveReminder()}
      >
        {saved ? <Check className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
        {saved ? "Saved" : "Remind me"}
      </Button>
    </div>
  );
}

async function getEarningsCandidates() {
  const seen = new Set<string>();
  const candidates: Array<{ ticker: string; companyName: string | null }> = [];

  try {
    const watchlistResponse = await fetch("/api/watchlist", {
      credentials: "same-origin",
    });
    const watchlist = (await watchlistResponse.json()) as WatchlistApiResponse;

    (watchlist.items ?? []).forEach((item) => pushCandidate(candidates, seen, item));
  } catch {
    // Earnings watch silently falls through to portfolio and fallback names.
  }

  try {
    const portfolioResponse = await fetch("/api/portfolio/holdings", {
      credentials: "same-origin",
    });
    const portfolio = (await portfolioResponse.json()) as PortfolioHoldingsResponse;

    (portfolio.holdings ?? []).forEach((item) =>
      pushCandidate(candidates, seen, {
        ticker: item.ticker,
        companyName: null,
      })
    );
  } catch {
    // Fallback names cover empty or temporarily unavailable saved data.
  }

  if (candidates.length < 3) {
    FALLBACK_TICKERS.forEach((ticker) =>
      pushCandidate(candidates, seen, { ticker, companyName: null })
    );
  }

  return candidates.slice(0, 8);
}

function pushCandidate(
  candidates: Array<{ ticker: string; companyName: string | null }>,
  seen: Set<string>,
  item: { ticker: string; companyName: string | null }
) {
  const ticker = item.ticker.trim().toUpperCase();

  if (!ticker || seen.has(ticker)) {
    return;
  }

  seen.add(ticker);
  candidates.push({ ticker, companyName: item.companyName });
}

function isValidPct(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 50 && Math.round(parsed * 10) === parsed * 10;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function daysUntil(value: string) {
  const today = new Date();
  const date = new Date(`${value}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.max(
    0,
    Math.ceil((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  );

  return days === 0 ? "Today" : `${days} days`;
}
