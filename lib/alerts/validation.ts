import type {
  Alert,
  AlertDirection,
  AlertRow,
  AlertStatus,
  AlertType,
  CreateAlertInput,
} from "@/lib/alerts/types";

const ALERT_TYPES = new Set<AlertType>([
  "session_move",
  "price_level",
  "earnings_reminder",
]);
const SESSION_DIRECTIONS = new Set<AlertDirection>(["up", "down", "either"]);
const PRICE_DIRECTIONS = new Set<AlertDirection>(["above", "below"]);
const STATUS_VALUES = new Set<AlertStatus>([
  "pending",
  "active",
  "fired",
  "paused",
  "failed",
]);

export function normalizeAlertRow(row: AlertRow): Alert {
  return {
    id: row.id,
    user_id: row.user_id,
    ticker: row.ticker,
    alert_type: row.alert_type,
    direction: row.direction,
    threshold_pct:
      row.threshold_pct === null ? null : Number(row.threshold_pct),
    threshold_price:
      row.threshold_price === null ? null : Number(row.threshold_price),
    is_enabled: row.is_enabled,
    status: row.status,
    last_triggered_at: row.last_triggered_at,
    after_hours_note: row.after_hours_note,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function validateCreateAlertBody(
  body: Record<string, unknown>
): { ok: true; value: CreateAlertInput } | { ok: false; error: string } {
  const ticker = validateAlertTicker(body.ticker);

  if (!ticker.ok) {
    return ticker;
  }

  const alertType = validateAlertType(body.alert_type);

  if (!alertType.ok) {
    return alertType;
  }

  if (alertType.value === "session_move") {
    const direction = validateDirection(body.direction, SESSION_DIRECTIONS);

    if (!direction.ok) {
      return direction;
    }

    const threshold = parseNumber(body.threshold_pct);

    if (
      typeof threshold !== "number" ||
      threshold < 1 ||
      threshold > 50 ||
      !hasAtMostOneDecimal(threshold)
    ) {
      return { ok: false, error: "Session move threshold must be 1 to 50." };
    }

    return {
      ok: true,
      value: {
        ticker: ticker.value,
        alert_type: alertType.value,
        direction: direction.value,
        threshold_pct: threshold,
        threshold_price: null,
      },
    };
  }

  if (alertType.value === "price_level") {
    const direction = validateDirection(body.direction, PRICE_DIRECTIONS);

    if (!direction.ok) {
      return direction;
    }

    const thresholdPrice = parseNumber(body.threshold_price);

    if (typeof thresholdPrice !== "number" || thresholdPrice <= 0) {
      return { ok: false, error: "Price level must be greater than 0." };
    }

    return {
      ok: true,
      value: {
        ticker: ticker.value,
        alert_type: alertType.value,
        direction: direction.value,
        threshold_pct: null,
        threshold_price: thresholdPrice,
      },
    };
  }

  return {
    ok: true,
    value: {
      ticker: ticker.value,
      alert_type: "earnings_reminder",
      direction: null,
      threshold_pct: null,
      threshold_price: null,
    },
  };
}

export function validateAlertPatchBody(
  body: Record<string, unknown>
): { ok: true; value: { is_enabled?: boolean; status?: AlertStatus } } | { ok: false; error: string } {
  const allowed = new Set(["is_enabled", "status"]);
  const unsupported = Object.keys(body).find((key) => !allowed.has(key));

  if (unsupported) {
    return { ok: false, error: "Unsupported alert field." };
  }

  const update: { is_enabled?: boolean; status?: AlertStatus } = {};

  if ("is_enabled" in body) {
    if (typeof body.is_enabled !== "boolean") {
      return { ok: false, error: "Alert enabled state must be true or false." };
    }

    update.is_enabled = body.is_enabled;
  }

  if ("status" in body) {
    if (body.status !== "active" || !STATUS_VALUES.has(body.status)) {
      return { ok: false, error: "Unsupported alert status update." };
    }

    update.status = body.status;
  }

  if (!Object.keys(update).length) {
    return { ok: false, error: "No alert updates were provided." };
  }

  return { ok: true, value: update };
}

export function validateAlertTicker(
  value: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: "Ticker is required." };
  }

  const ticker = value.trim().toUpperCase();

  if (!/^[A-Z][A-Z0-9.]{0,4}$/.test(ticker)) {
    return { ok: false, error: "Ticker must be a valid symbol." };
  }

  return { ok: true, value: ticker };
}

function validateAlertType(
  value: unknown
): { ok: true; value: AlertType } | { ok: false; error: string } {
  if (typeof value !== "string" || !ALERT_TYPES.has(value as AlertType)) {
    return { ok: false, error: "Unsupported alert type." };
  }

  return { ok: true, value: value as AlertType };
}

function validateDirection(
  value: unknown,
  allowed: Set<AlertDirection>
): { ok: true; value: AlertDirection } | { ok: false; error: string } {
  if (typeof value !== "string" || !allowed.has(value as AlertDirection)) {
    return { ok: false, error: "Unsupported alert direction." };
  }

  return { ok: true, value: value as AlertDirection };
}

function parseNumber(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

function hasAtMostOneDecimal(value: number) {
  return Math.round(value * 10) === value * 10;
}
