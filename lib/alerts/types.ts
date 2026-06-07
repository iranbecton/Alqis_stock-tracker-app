export type AlertType = "session_move" | "price_level" | "earnings_reminder";

export type AlertDirection =
  | "up"
  | "down"
  | "either"
  | "above"
  | "below";

export type AlertStatus = "pending" | "active" | "fired" | "paused" | "failed";

export type AlertRow = {
  id: string;
  user_id: string;
  ticker: string;
  alert_type: AlertType;
  direction: AlertDirection | null;
  threshold_pct: string | number | null;
  threshold_price: string | number | null;
  is_enabled: boolean;
  status: AlertStatus;
  last_triggered_at: string | null;
  after_hours_note: string | null;
  created_at: string;
  updated_at: string;
};

export type Alert = {
  id: string;
  user_id: string;
  ticker: string;
  alert_type: AlertType;
  direction: AlertDirection | null;
  threshold_pct: number | null;
  threshold_price: number | null;
  is_enabled: boolean;
  status: AlertStatus;
  last_triggered_at: string | null;
  after_hours_note: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateAlertInput = {
  ticker: string;
  alert_type: AlertType;
  direction: AlertDirection | null;
  threshold_pct: number | null;
  threshold_price: number | null;
};
