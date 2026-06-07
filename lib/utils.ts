import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind conflict resolution.
 * Later classes override earlier ones when they conflict.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLargeNumber(value: number, prefix = "$") {
  const sign = value < 0 ? "-" : "";
  const absoluteValue = Math.abs(value);

  if (!Number.isFinite(value)) {
    return `${prefix}—`;
  }

  if (absoluteValue >= 1_000_000_000_000) {
    return `${sign}${prefix}${trimTrailingZero(absoluteValue / 1_000_000_000_000)}T`;
  }

  if (absoluteValue >= 1_000_000_000) {
    return `${sign}${prefix}${trimTrailingZero(absoluteValue / 1_000_000_000)}B`;
  }

  if (absoluteValue >= 1_000_000) {
    return `${sign}${prefix}${trimTrailingZero(absoluteValue / 1_000_000)}M`;
  }

  return `${sign}${prefix}${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(absoluteValue)}`;
}

function trimTrailingZero(value: number) {
  return value.toFixed(1).replace(/\.0$/, "");
}
