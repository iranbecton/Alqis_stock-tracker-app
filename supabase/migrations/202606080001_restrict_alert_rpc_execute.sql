-- Restrict execute privilege on the alert after-hours notes RPC.
-- This function is cron/service-role only; no authenticated or anonymous
-- client should call it directly.

REVOKE EXECUTE ON FUNCTION public.update_alert_after_hours_notes(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_alert_after_hours_notes(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_alert_after_hours_notes(jsonb) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.update_alert_after_hours_notes(jsonb) TO service_role;
