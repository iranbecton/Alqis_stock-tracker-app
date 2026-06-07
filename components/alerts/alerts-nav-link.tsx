"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Alert } from "@/lib/alerts/types";

type AlertsResponse = {
  alerts?: Alert[];
  error?: string;
};

type AlertsNavLinkProps = {
  className?: string;
  showIcon?: boolean;
};

const FIVE_MINUTES = 5 * 60 * 1000;

export function AlertsNavLink({ className, showIcon = false }: AlertsNavLinkProps) {
  const pathname = usePathname();
  const [firedCount, setFiredCount] = useState(0);

  const loadFiredCount = useCallback(async () => {
    try {
      const response = await fetch("/api/alerts", {
        credentials: "same-origin",
      });

      if (response.status === 401 || response.status === 403) {
        setFiredCount(0);
        return;
      }

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as AlertsResponse;
      const count = (payload.alerts ?? []).filter(
        (alert) => alert.status === "fired"
      ).length;

      setFiredCount(count);
    } catch {
      setFiredCount(0);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadFiredCount();
    }, 0);

    const interval = window.setInterval(() => {
      void loadFiredCount();
    }, FIVE_MINUTES);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadFiredCount, pathname]);

  return (
    <Link href="/alerts" className={className}>
      <span className="relative inline-flex items-center gap-1.5">
        {showIcon ? <Bell className="h-3.5 w-3.5" /> : null}
        <span>Alerts</span>
        {firedCount > 0 ? (
          <span
            className="grid min-h-4 min-w-4 place-items-center rounded-full px-1 text-[0.62rem] font-black leading-none text-[#070F14]"
            style={{ backgroundColor: "#d2a96b" }}
            aria-label={`${firedCount} fired alerts`}
          >
            {firedCount}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
