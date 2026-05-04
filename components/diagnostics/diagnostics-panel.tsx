"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  DiagnosticCheck,
  DiagnosticsReport,
  DiagnosticStatus,
} from "@/lib/diagnostics/run-diagnostics";

type DiagnosticsResponse = DiagnosticsReport & {
  error?: string;
};

export function DiagnosticsPanel() {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDiagnostics = useCallback(async (refreshing: boolean) => {
    setError(null);
    setIsLoading(!refreshing);
    setIsRefreshing(refreshing);

    try {
      const response = await fetch("/api/diagnostics", {
        cache: "no-store",
      });
      const json = (await response.json()) as DiagnosticsResponse;

      if (!response.ok) {
        throw new Error(json.error ?? "Diagnostics unavailable.");
      }

      setReport(json);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Diagnostics unavailable."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDiagnostics(false);
  }, [loadDiagnostics]);

  return (
    <Card
      variant="subtle"
      radius="xl"
      className="border-accent-ai/14 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_84%,var(--accent-ai)_9%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_4%)_100%)]"
    >
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardEyebrow>
              <Activity className="h-3.5 w-3.5" />
              Internal health
            </CardEyebrow>
            <CardTitle>ALQIS Diagnostics</CardTitle>
            <CardDescription>
              Internal health view for development and provider monitoring.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getBadgeVariant(report?.status)} size="sm" className="normal-case tracking-normal">
              {report?.status ? formatStatus(report.status) : "Checking"}
            </Badge>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isRefreshing}
              onClick={() => void loadDiagnostics(true)}
              className="min-h-11"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh checks"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <DiagnosticsSkeleton />
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-warn/20 bg-warn-bg/24 px-4 py-3 text-body-sm text-warn">
            {error}
          </div>
        ) : report ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border/70 bg-surface/42 px-4 py-3">
              <div>
                <p className="section-kicker text-ink-subtle">Generated</p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {formatDateTime(report.generatedAt)}
                </p>
              </div>
              <p className="max-w-xl text-body-sm text-ink-muted">
                Safe messages only. Secrets, raw provider payloads, and stack traces are not exposed.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {report.checks.map((check) => (
                <DiagnosticCheckCard key={check.id} check={check} />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DiagnosticCheckCard({ check }: { check: DiagnosticCheck }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--surface)_18%)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{check.label}</p>
          <p className="mt-1 text-[0.78rem] leading-5 text-ink-subtle">
            {check.id}
          </p>
        </div>
        <Badge variant={getBadgeVariant(check.status)} size="sm" className="normal-case tracking-normal">
          {formatStatus(check.status)}
        </Badge>
      </div>

      <p className="mt-4 text-body-sm leading-6 text-ink-muted">{check.message}</p>
      <p className="mt-3 border-t border-border/60 pt-3 text-[0.78rem] leading-5 text-ink-subtle" data-numeric>
        {check.latencyMs}ms
      </p>
    </article>
  );
}

function DiagnosticsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="h-36 rounded-[var(--radius-lg)] border border-border/60 bg-surface/42 p-4"
        >
          <div className="h-4 w-28 rounded-full bg-surface-elevated" />
          <div className="mt-5 h-3 w-full rounded-full bg-surface-elevated" />
          <div className="mt-2 h-3 w-2/3 rounded-full bg-surface-elevated" />
        </div>
      ))}
    </div>
  );
}

function getBadgeVariant(status?: DiagnosticStatus) {
  if (status === "ok") return "gain";
  if (status === "degraded") return "warn";
  if (status === "unavailable") return "loss";
  return "outline";
}

function formatStatus(status: DiagnosticStatus) {
  if (status === "ok") return "OK";
  if (status === "degraded") return "Degraded";
  return "Unavailable";
}

function formatDateTime(value: string) {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}
