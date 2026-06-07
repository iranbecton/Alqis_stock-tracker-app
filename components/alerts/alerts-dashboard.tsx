"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertEntryButton } from "@/components/alerts/alert-entry-button";
import { AlertCard } from "@/components/alerts/alert-card";
import type { Alert, AlertStatus } from "@/lib/alerts/types";

type AlertsResponse = {
  alerts: Alert[];
};

const GROUPS: Array<{
  status: AlertStatus;
  label: string;
  detail?: string;
}> = [
  { status: "active", label: "Active" },
  { status: "pending", label: "Pending" },
  { status: "fired", label: "Fired", detail: "Detected — review and reset if still relevant." },
  { status: "paused", label: "Paused" },
  { status: "failed", label: "Failed" },
];

export function AlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const groupedAlerts = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        alerts: alerts.filter((alert) => alert.status === group.status),
      })),
    [alerts]
  );

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/alerts", {
        credentials: "same-origin",
      });
      const payload = (await response.json()) as Partial<AlertsResponse> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load alerts.");
      }

      setAlerts(payload.alerts ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-kicker text-[#72c7be]">Monitoring</p>
          <h1 className="mt-1 font-serif text-3xl text-[#F4EEE2]">My alerts</h1>
        </div>
        <AlertEntryButton onSaved={() => void loadAlerts()}>New alert</AlertEntryButton>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-[1rem] bg-white/[0.04]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[1rem] border border-[#c9877a]/24 bg-[#c9877a]/10 px-4 py-3 text-sm text-[#f1c3bb]">
          {error}
        </div>
      ) : alerts.length ? (
        <div className="space-y-6">
          {groupedAlerts.map((group) =>
            group.alerts.length ? (
              <section key={group.status} className="space-y-3">
                <div>
                  <h2 className="text-lg font-black text-[#F4EEE2]">{group.label}</h2>
                  {group.detail ? (
                    <p className="mt-1 text-sm text-[#a9bad0]">{group.detail}</p>
                  ) : null}
                </div>
                <div className="grid gap-3">
                  {group.alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} onChanged={loadAlerts} />
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      ) : (
        <div className="grid place-items-center rounded-[1.15rem] border border-dashed border-[#2f72d5]/28 bg-[#07111f]/46 px-5 py-14 text-center">
          <p className="section-kicker text-[#72c7be]">No alerts yet</p>
          <h2 className="mt-2 font-serif text-2xl text-[#F4EEE2]">
            Set an alert from any stock page or watchlist.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#a9bad0]">
            Saved alerts wait for the market-data evaluator that ships next.
          </p>
          <div className="mt-5">
            <AlertEntryButton onSaved={() => void loadAlerts()}>New alert</AlertEntryButton>
          </div>
        </div>
      )}
    </div>
  );
}
