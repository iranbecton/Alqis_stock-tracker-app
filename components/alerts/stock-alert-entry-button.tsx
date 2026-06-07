"use client";

import { AlertEntryButton } from "@/components/alerts/alert-entry-button";

type StockAlertEntryButtonProps = {
  initialTicker?: string;
  initialCompanyName?: string | null;
  mode?: "button" | "icon";
  className?: string;
};

export function StockAlertEntryButton(props: StockAlertEntryButtonProps) {
  return <AlertEntryButton {...props} />;
}
