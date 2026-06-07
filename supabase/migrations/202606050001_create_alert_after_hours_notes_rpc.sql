create or replace function public.update_alert_after_hours_notes(note_updates jsonb)
returns integer
language plpgsql
as $$
declare
  updated_count integer;
begin
  update public.alerts as alert
  set
    after_hours_note = update_row.note,
    updated_at = now()
  from jsonb_to_recordset(note_updates) as update_row(ticker text, note text)
  where alert.ticker = update_row.ticker
    and alert.status in ('active', 'fired')
    and alert.is_enabled = true;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;
