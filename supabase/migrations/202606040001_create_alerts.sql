create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  alert_type text not null check (alert_type in ('session_move', 'price_level', 'earnings_reminder')),
  direction text check (direction in ('up', 'down', 'either', 'above', 'below')),
  threshold_pct numeric check (threshold_pct is null or (threshold_pct >= 1 and threshold_pct <= 50)),
  threshold_price numeric check (threshold_price is null or threshold_price > 0),
  is_enabled boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'active', 'fired', 'paused', 'failed')),
  last_triggered_at timestamptz,
  after_hours_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alerts_session_move_shape check (
    alert_type <> 'session_move'
    or (
      direction in ('up', 'down', 'either')
      and threshold_pct is not null
      and threshold_price is null
    )
  ),
  constraint alerts_price_level_shape check (
    alert_type <> 'price_level'
    or (
      direction in ('above', 'below')
      and threshold_price is not null
      and threshold_pct is null
    )
  ),
  constraint alerts_earnings_reminder_shape check (
    alert_type <> 'earnings_reminder'
    or (
      direction is null
      and threshold_pct is null
      and threshold_price is null
    )
  )
);

alter table public.alerts enable row level security;

create policy "Users can select their own alerts"
  on public.alerts
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own alerts"
  on public.alerts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own alerts"
  on public.alerts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own alerts"
  on public.alerts
  for delete
  using (auth.uid() = user_id);

create index alerts_user_status_created_idx
  on public.alerts (user_id, status, created_at desc);

create index alerts_ticker_enabled_idx
  on public.alerts (ticker, is_enabled);

create or replace function public.set_alerts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_alerts_updated_at
before update on public.alerts
for each row
execute function public.set_alerts_updated_at();
