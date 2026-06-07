"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Plus, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  PortfolioHoldingWithCalcs,
  PortfolioHoldingsResponse,
  PortfolioInsightResponse,
} from "@/lib/portfolio/types";
import { cn, formatLargeNumber } from "@/lib/utils";

type HoldingFormState = {
  ticker: string;
  shares: string;
  avg_cost: string;
  notes: string;
};

const emptyForm: HoldingFormState = {
  ticker: "",
  shares: "",
  avg_cost: "",
  notes: "",
};
const DASH = "\u2014";

export function PortfolioTracker() {
  const [data, setData] = useState<PortfolioHoldingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<PortfolioInsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingHolding, setEditingHolding] =
    useState<PortfolioHoldingWithCalcs | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadInsight = useCallback(async () => {
    setInsightLoading(true);
    setInsightError(null);

    try {
      const response = await fetch("/api/explain/portfolio", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load portfolio read.");
      }

      setInsight(payload as PortfolioInsightResponse);
    } catch (loadError) {
      setInsightError(
        loadError instanceof Error ? loadError.message : "Unable to load portfolio read."
      );
    } finally {
      setInsightLoading(false);
    }
  }, []);

  const loadHoldings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio/holdings", {
        credentials: "same-origin",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load portfolio.");
      }

      const nextData = payload as PortfolioHoldingsResponse;
      setData(nextData);

      if (nextData.holdings.length >= 2) {
        void loadInsight();
      } else {
        setInsight(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load portfolio.");
    } finally {
      setLoading(false);
    }
  }, [loadInsight]);

  useEffect(() => {
    void loadHoldings();
  }, [loadHoldings]);

  const holdings = data?.holdings ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-4">
      <section className="rounded-[1.25rem] border border-[#2f72d5]/22 bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-floating)] sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile
            label="Total Value"
            value={summary ? formatCurrencyOrDash(summary.total_current_value) : DASH}
            tone={summary?.total_gain_loss_value}
          />
          <SummaryTile
            label="Cost Basis"
            value={summary ? formatCurrencyOrDash(summary.total_cost_basis) : DASH}
          />
          <SummaryTile
            label="Total Gain/Loss"
            value={
              summary
                ? formatGainLoss(summary.total_gain_loss_value, summary.total_gain_loss_pct)
                : DASH
            }
            tone={summary?.total_gain_loss_value}
          />
          <SummaryTile
            label="Holdings Count"
            value={summary ? String(summary.holdings_count) : DASH}
          />
        </div>
        {summary?.all_data_limited ? (
          <p className="mt-3 text-sm text-[#d2a96b]">
            Data limited - market prices currently unavailable; showing cost basis only.
          </p>
        ) : summary?.has_data_limited ? (
          <p className="mt-3 text-sm text-[#7da6d9]">
            Data limited - some prices unavailable; figures are partial estimates.
          </p>
        ) : null}
      </section>

      <PortfolioIntelligencePanel
        holdingsCount={holdings.length}
        insight={insight}
        loading={insightLoading || (loading && !insight)}
        error={insightError}
        onRefresh={() => void loadInsight()}
      />

      <section className="rounded-[1.25rem] border border-[#2f72d5]/22 bg-[var(--surface-floating)] p-4 shadow-[var(--shadow-floating)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-kicker text-[#72c7be]">Manual holdings</p>
            <h2 className="mt-1 font-serif text-2xl text-[#F4EEE2]">Portfolio tracker</h2>
          </div>
          <Button
            type="button"
            className="bg-[#72c7be] text-[#070F14] hover:bg-[#8ed8d0]"
            onClick={() => {
              setEditingHolding(null);
              setModalMode("add");
            }}
          >
            <Plus className="h-4 w-4" />
            Add Holding
          </Button>
        </div>

        {loading ? (
          <div className="mt-5 grid gap-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-[0.85rem] bg-white/[0.04]" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-5 rounded-[0.9rem] border border-[#c9877a]/24 bg-[#c9877a]/10 px-4 py-3 text-sm text-[#f1c3bb]">
            {error}
          </div>
        ) : holdings.length ? (
          <HoldingsTable
            holdings={holdings}
            deleteConfirmId={deleteConfirmId}
            onEdit={(holding) => {
              setEditingHolding(holding);
              setModalMode("edit");
            }}
            onAskDelete={setDeleteConfirmId}
            onDeleted={loadHoldings}
          />
        ) : (
          <EmptyPortfolioState
            onAdd={() => {
              setEditingHolding(null);
              setModalMode("add");
            }}
          />
        )}
      </section>

      {modalMode ? (
        <HoldingModal
          mode={modalMode}
          holding={editingHolding}
          onClose={() => setModalMode(null)}
          onSaved={async () => {
            setModalMode(null);
            await loadHoldings();
          }}
        />
      ) : null}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: number | null;
}) {
  return (
    <div className="rounded-[0.95rem] border border-[#2f72d5]/18 bg-[#07111f]/58 px-4 py-3">
      <p className="section-kicker text-[#7891ad]">{label}</p>
      <p
        className={cn(
          "mt-2 text-xl font-black text-[#F4EEE2]",
          typeof tone === "number" && tone > 0 && "text-[#63cfa8]",
          typeof tone === "number" && tone < 0 && "text-[#c9877a]"
        )}
        data-numeric
      >
        {value}
      </p>
    </div>
  );
}

function PortfolioIntelligencePanel({
  holdingsCount,
  insight,
  loading,
  error,
  onRefresh,
}: {
  holdingsCount: number;
  insight: PortfolioInsightResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  if (holdingsCount < 2) {
    return (
      <section className="rounded-[1.25rem] border border-[#2f72d5]/22 bg-[var(--surface-floating)] p-4 shadow-[var(--shadow-floating)] sm:p-5">
        <p className="section-kicker text-[#72c7be]">Portfolio intelligence</p>
        <p className="mt-2 text-sm text-[#a9bad0]">
          Add more holdings to see portfolio intelligence.
        </p>
      </section>
    );
  }

  if (loading && !insight) {
    return (
      <section className="rounded-[1.25rem] border border-[#2f72d5]/22 bg-[var(--surface-floating)] p-4 shadow-[var(--shadow-floating)] sm:p-5">
        <div className="h-5 w-48 animate-pulse rounded bg-white/[0.05]" />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-[1rem] bg-white/[0.04]" />
          ))}
        </div>
      </section>
    );
  }

  if (error && !insight) {
    return (
      <section className="rounded-[1.25rem] border border-[#c9877a]/24 bg-[#c9877a]/10 p-4 text-sm text-[#f1c3bb] shadow-[var(--shadow-floating)] sm:p-5">
        {error}
      </section>
    );
  }

  if (!insight) {
    return null;
  }

  const sectors = collapseSectors(insight.sector_concentration);
  const hasSectors = sectors.length > 0;

  return (
    <section className="rounded-[1.25rem] border border-[#2f72d5]/22 bg-[var(--surface-floating)] p-4 shadow-[var(--shadow-floating)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-kicker text-[#72c7be]">Portfolio intelligence</p>
          <h2 className="mt-1 font-serif text-2xl text-[#F4EEE2]">Today&apos;s Movement</h2>
          <p
            className={cn(
              "mt-2 text-xl font-black text-[#F4EEE2]",
              typeof insight.portfolio_movement.total_day_change_value === "number" &&
                insight.portfolio_movement.total_day_change_value > 0 &&
                "text-[#63cfa8]",
              typeof insight.portfolio_movement.total_day_change_value === "number" &&
                insight.portfolio_movement.total_day_change_value < 0 &&
                "text-[#c9877a]"
            )}
            data-numeric
          >
            {formatDayMove(
              insight.portfolio_movement.total_day_change_value,
              insight.portfolio_movement.total_day_change_pct
            )}
          </p>
          {insight.data_status === "partial" ? (
            <p className="mt-1 text-sm text-[#7da6d9]">Based on available prices.</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="quiet"
          size="sm"
          className="border border-[#2f72d5]/24"
          disabled={loading}
          onClick={onRefresh}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <div className="rounded-[1rem] border border-[#8B84C7]/40 bg-[#8B84C7]/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="section-kicker text-[#c9c4ff]">ALQIS Portfolio Read</p>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#d8d3ff]">
              <span className="h-2 w-2 rounded-full bg-[#8B84C7]" />
              {insight.confidence.label}
            </span>
          </div>
          <p className="mt-3 text-base leading-7 text-[#F4EEE2]">{insight.insight}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#a9bad0]">
            <span>{formatTimestamp(insight.generated_at)}</span>
            <span>Informational only &mdash; not investment advice.</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ContributorColumn
            title="Gainers"
            items={insight.top_contributors.gainers}
            tone="gain"
          />
          <ContributorColumn
            title="Detractors"
            items={insight.top_contributors.losers}
            tone="loss"
          />
        </div>
      </div>

      {hasSectors ? (
        <div className="mt-4 rounded-[1rem] border border-[#2f72d5]/18 bg-[#07111f]/48 p-4">
          <p className="section-kicker text-[#72c7be]">Sector Breakdown</p>
          <div className="mt-3 grid gap-3">
            {sectors.map((sector) => (
              <div key={sector.sector} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[#F4EEE2]">{sector.sector}</span>
                  <span className="text-[#a9bad0]" data-numeric>
                    {sector.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#102033]">
                  <div
                    className="h-full rounded-full bg-[#72c7be]"
                    style={{ width: `${Math.min(Math.max(sector.pct, 0), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {insight.concentration_risk.is_concentrated ? (
        <p className="mt-4 rounded-[0.9rem] border border-[#d2a96b]/24 bg-[#d2a96b]/10 px-3 py-2 text-sm text-[#e6c27d]">
          High concentration detected &mdash; one or a few holdings make up most of this portfolio.
        </p>
      ) : null}
    </section>
  );
}

function ContributorColumn({
  title,
  items,
  tone,
}: {
  title: string;
  items: PortfolioInsightResponse["top_contributors"]["gainers"];
  tone: "gain" | "loss";
}) {
  return (
    <div className="rounded-[1rem] border border-[#2f72d5]/18 bg-[#07111f]/48 p-4">
      <p className="section-kicker text-[#7891ad]">{title}</p>
      {items.length ? (
        <div className="mt-3 grid gap-2">
          {items.map((item) => (
            <div key={item.ticker} className="flex items-center justify-between gap-3">
              <span className="font-black text-[#F4EEE2]">{item.ticker}</span>
              <span
                className={cn(
                  "text-sm font-black",
                  tone === "gain" ? "text-[#63cfa8]" : "text-[#c9877a]"
                )}
                data-numeric
              >
                {formatDayMove(item.day_change_value, item.day_change_pct)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#7891ad]">
          {tone === "gain" ? "No gainers today." : "No detractors today."}
        </p>
      )}
    </div>
  );
}

function HoldingsTable({
  holdings,
  deleteConfirmId,
  onEdit,
  onAskDelete,
  onDeleted,
}: {
  holdings: PortfolioHoldingWithCalcs[];
  deleteConfirmId: string | null;
  onEdit: (holding: PortfolioHoldingWithCalcs) => void;
  onAskDelete: (id: string | null) => void;
  onDeleted: () => Promise<void>;
}) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
        <thead className="text-[0.68rem] uppercase tracking-[0.16em] text-[#7891ad]">
          <tr className="border-b border-[#2f72d5]/22">
            <th className="py-3">Ticker</th>
            <th>Shares</th>
            <th>Avg Cost</th>
            <th>Current Price</th>
            <th>Current Value</th>
            <th>Gain/Loss</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <HoldingRow
              key={holding.id}
              holding={holding}
              confirming={deleteConfirmId === holding.id}
              onEdit={() => onEdit(holding)}
              onAskDelete={() => onAskDelete(holding.id)}
              onCancelDelete={() => onAskDelete(null)}
              onDeleted={onDeleted}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HoldingRow({
  holding,
  confirming,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onDeleted,
}: {
  holding: PortfolioHoldingWithCalcs;
  confirming: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function deleteHolding() {
    setDeleting(true);

    try {
      const response = await fetch(`/api/portfolio/holdings/${holding.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Unable to delete holding.");
      }

      await onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <tr className="border-b border-[#2f72d5]/14 last:border-b-0">
      <td className="py-3.5">
        <span className="font-black text-[#F4EEE2]">{holding.ticker}</span>
        {holding.price_status === "data-limited" ? (
          <Badge
            variant="outline"
            size="sm"
            className="ml-2 border-[#7da6d9]/30 bg-[#7da6d9]/10 text-[#9ec3f0]"
          >
            Data limited
          </Badge>
        ) : null}
      </td>
      <td data-numeric>{formatNumber(holding.shares)}</td>
      <td data-numeric>{formatCurrencyOrDash(holding.avg_cost)}</td>
      <td data-numeric>{formatCurrencyOrDash(holding.current_price)}</td>
      <td data-numeric>{formatCurrencyOrDash(holding.current_value)}</td>
      <td
        className={cn(
          "font-black",
          typeof holding.gain_loss_value === "number" &&
            holding.gain_loss_value > 0 &&
            "text-[#63cfa8]",
          typeof holding.gain_loss_value === "number" &&
            holding.gain_loss_value < 0 &&
            "text-[#c9877a]"
        )}
        data-numeric
      >
        {formatGainLoss(holding.gain_loss_value, holding.gain_loss_pct)}
      </td>
      <td className="text-right">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="quiet" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          {confirming ? (
            <>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={deleting}
                onClick={() => void deleteHolding()}
              >
                Confirm
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onCancelDelete}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="button" variant="quiet" size="sm" onClick={onAskDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmptyPortfolioState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-8 grid place-items-center rounded-[1rem] border border-dashed border-[#2f72d5]/28 bg-[#07111f]/42 px-5 py-12 text-center">
      <p className="section-kicker text-[#72c7be]">Tracking only</p>
      <h3 className="mt-2 font-serif text-2xl text-[#F4EEE2]">Add your first holding.</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#a9bad0]">
        Track manually entered positions with delayed market prices and honest Data limited labels.
      </p>
      <Button
        type="button"
        className="mt-5 bg-[#72c7be] text-[#070F14] hover:bg-[#8ed8d0]"
        onClick={onAdd}
      >
        Add Your First Holding
      </Button>
    </div>
  );
}

function HoldingModal({
  mode,
  holding,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  holding: PortfolioHoldingWithCalcs | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<HoldingFormState>(() =>
    holding
      ? {
          ticker: holding.ticker,
          shares: String(holding.shares),
          avg_cost: String(holding.avg_cost),
          notes: holding.notes ?? "",
        }
      : emptyForm
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => validateForm(form, mode), [form, mode]);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const body =
        mode === "add"
          ? {
              ticker: form.ticker.trim().toUpperCase(),
              shares: Number(form.shares),
              avg_cost: Number(form.avg_cost),
              notes: form.notes.trim() || null,
            }
          : {
              shares: Number(form.shares),
              avg_cost: Number(form.avg_cost),
              notes: form.notes.trim() || null,
            };
      const response = await fetch(
        mode === "add"
          ? "/api/portfolio/holdings"
          : `/api/portfolio/holdings/${holding?.id}`,
        {
          method: mode === "add" ? "POST" : "PATCH",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to save holding.");
      }

      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save holding.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={submitForm}
        className="w-full max-w-lg rounded-[1.1rem] border border-[#2f72d5]/28 bg-[#0D1B24] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-kicker text-[#72c7be]">
              {mode === "add" ? "Add holding" : "Edit holding"}
            </p>
            <h2 className="mt-1 font-serif text-2xl text-[#F4EEE2]">
              {mode === "add" ? "Manual portfolio entry" : holding?.ticker}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-[#F4EEE2]/70 hover:text-[#F4EEE2]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Ticker" required>
            <input
              value={form.ticker}
              disabled={mode === "edit"}
              onChange={(event) =>
                setForm((current) => ({ ...current, ticker: event.target.value }))
              }
              onBlur={() =>
                setForm((current) => ({
                  ...current,
                  ticker: current.ticker.trim().toUpperCase(),
                }))
              }
              className="portfolio-input"
              placeholder="AMD"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shares" required>
              <input
                value={form.shares}
                type="number"
                min="0"
                step="0.000001"
                onChange={(event) =>
                  setForm((current) => ({ ...current, shares: event.target.value }))
                }
                className="portfolio-input"
              />
            </Field>
            <Field label="Avg Cost Per Share (USD)" required>
              <input
                value={form.avg_cost}
                type="number"
                min="0"
                step="0.0001"
                onChange={(event) =>
                  setForm((current) => ({ ...current, avg_cost: event.target.value }))
                }
                className="portfolio-input"
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              value={form.notes}
              maxLength={280}
              rows={4}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              className="portfolio-input resize-none"
            />
          </Field>
        </div>

        {error ? (
          <p className="mt-4 rounded-[0.8rem] border border-[#c9877a]/24 bg-[#c9877a]/10 px-3 py-2 text-sm text-[#f1c3bb]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-[#72c7be] text-[#070F14] hover:bg-[#8ed8d0]"
          >
            {submitting ? "Saving..." : "Save Holding"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-[#c7d5e8]">
        {label}
        {required ? <span className="text-[#d2a96b]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function validateForm(form: HoldingFormState, mode: "add" | "edit") {
  if (mode === "add" && !form.ticker.trim()) {
    return "Ticker is required.";
  }

  if (mode === "add" && !/^[A-Za-z][A-Za-z0-9.-]{0,9}$/.test(form.ticker.trim())) {
    return "Ticker must be a valid symbol.";
  }

  if (!Number.isFinite(Number(form.shares)) || Number(form.shares) <= 0) {
    return "Shares must be greater than 0.";
  }

  if (!Number.isFinite(Number(form.avg_cost)) || Number(form.avg_cost) <= 0) {
    return "Average cost must be greater than 0.";
  }

  if (form.notes.length > 280) {
    return "Notes must be 280 characters or fewer.";
  }

  return null;
}

function formatCurrencyOrDash(value: number | null | undefined) {
  if (typeof value !== "number") {
    return DASH;
  }

  if (Math.abs(value) >= 1_000_000) {
    return formatLargeNumber(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatGainLoss(value: number | null | undefined, pct: number | null | undefined) {
  if (typeof value !== "number" || typeof pct !== "number") {
    return DASH;
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${formatCurrencyOrDash(value)} (${sign}${pct.toFixed(2)}%)`;
}

function formatDayMove(value: number | null | undefined, pct: number | null | undefined) {
  if (typeof value !== "number" || typeof pct !== "number") {
    return DASH;
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${formatCurrencyOrDash(value)} (${sign}${(pct * 100).toFixed(2)}%)`;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function collapseSectors(
  sectors: PortfolioInsightResponse["sector_concentration"]
) {
  if (sectors.length <= 5) {
    return sectors;
  }

  const visible = sectors.slice(0, 4);
  const otherPct = sectors.slice(4).reduce((sum, sector) => sum + sector.pct, 0);

  return [...visible, { sector: "Other", pct: otherPct }];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(value);
}
