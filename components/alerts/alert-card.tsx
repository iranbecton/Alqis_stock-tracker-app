import Link from "next/link";
import { Bell, BellOff, ExternalLink, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Alert } from "@/lib/alerts/types";
import { cn } from "@/lib/utils";

type AlertCardProps = {
  alert: Alert;
  onChanged: () => void;
};

export function AlertCard({ alert, onChanged }: AlertCardProps) {
  const view = getAlertView(alert);

  async function patchAlert(body: Record<string, unknown>) {
    const response = await fetch(`/api/alerts/${alert.id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      onChanged();
    }
  }

  async function removeAlert() {
    const response = await fetch(`/api/alerts/${alert.id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });

    if (response.ok) {
      onChanged();
    }
  }

  return (
    <article className="rounded-[1rem] border border-[#2f72d5]/22 bg-[#07111f]/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#F4EEE2]">{alert.ticker}</p>
            <Badge
              variant="outline"
              size="sm"
              className={cn("normal-case tracking-normal", view.badgeClassName)}
            >
              {view.statusLabel}
            </Badge>
          </div>
          <p className="mt-1 text-sm font-semibold text-[#a9bad0]">
            {formatAlertConfig(alert)}
          </p>
          <p className="mt-2 text-sm text-[#7891ad]">{view.metaLine}</p>
          <p className="mt-2 text-sm text-[#F4EEE2]">
            Alerts are for monitoring only and do not constitute investment advice.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {alert.status === "fired" ? (
            <Button asChild variant="quiet" size="sm" className="border border-[#2f72d5]/22">
              <Link href={`/stocks/${alert.ticker}`}>
                View ALQIS Read
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          {alert.status === "fired" && alert.alert_type === "price_level" ? (
            <Button
              type="button"
              variant="quiet"
              size="sm"
              className="border border-[#72c7be]/22"
              onClick={() => void patchAlert({ status: "active" })}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          ) : null}
          {alert.status !== "fired" ? (
            <Button
              type="button"
              variant="quiet"
              size="sm"
              className="border border-[#2f72d5]/22"
              onClick={() => void patchAlert({ is_enabled: !alert.is_enabled })}
            >
              {alert.is_enabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {alert.is_enabled ? "Pause" : "Resume"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => void removeAlert()}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      </div>

      {alert.after_hours_note ? (
        <p className="mt-3 rounded-[0.85rem] border border-[#7da6d9]/24 bg-[#7da6d9]/10 px-3 py-2 text-sm text-[#9ec3f0]">
          {alert.after_hours_note}
        </p>
      ) : null}
    </article>
  );
}

function getAlertView(alert: Alert) {
  if (alert.status === "active") {
    return {
      statusLabel: "Watching · Market hours only",
      metaLine: "Checked every 5 min during market hours",
      badgeClassName: "border-[#72c7be]/28 bg-[#72c7be]/10 text-[#9de1dc]",
    };
  }

  if (alert.status === "fired") {
    return {
      statusLabel: `Detected ${formatDetectedDate(alert.last_triggered_at)} · In-app only`,
      metaLine: "View ALQIS Read for context",
      badgeClassName: "border-[#63cfa8]/28 bg-[#63cfa8]/10 text-[#bcebd9]",
    };
  }

  if (alert.status === "paused") {
    return {
      statusLabel: "Paused by you",
      metaLine: "Toggle to resume watching",
      badgeClassName: "border-[#7da6d9]/28 bg-[#7da6d9]/10 text-[#9ec3f0]",
    };
  }

  if (alert.status === "failed") {
    return {
      statusLabel: "No market data found",
      metaLine: "Check the symbol or remove this alert",
      badgeClassName: "border-[#c9877a]/28 bg-[#c9877a]/10 text-[#f1c3bb]",
    };
  }

  return {
    statusLabel: "Waiting for market data",
    metaLine: "Checking for market data",
    badgeClassName: "border-[#d2a96b]/28 bg-[#d2a96b]/10 text-[#e6c27d]",
  };
}

function formatAlertConfig(alert: Alert) {
  if (alert.alert_type === "session_move") {
    return `Session Move / ${formatDirection(alert.direction)} / ${alert.threshold_pct ?? "—"}%`;
  }

  if (alert.alert_type === "price_level") {
    return `Price Level / ${formatDirection(alert.direction)} / ${formatCurrency(alert.threshold_price)}`;
  }

  return "Earnings Reminder";
}

function formatDirection(direction: Alert["direction"]) {
  if (!direction) return "Reminder";
  return direction.charAt(0).toUpperCase() + direction.slice(1);
}

function formatCurrency(value: number | null) {
  if (typeof value !== "number") {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDetectedDate(value: string | null) {
  if (!value) {
    return "today";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
