create table public.portfolio_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  shares numeric(18,6) not null check (shares > 0),
  avg_cost numeric(18,4) not null check (avg_cost > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_holdings enable row level security;

create policy "Users can manage their own holdings"
  on public.portfolio_holdings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index portfolio_holdings_user_created_idx
  on public.portfolio_holdings (user_id, created_at desc);

create or replace function public.set_portfolio_holdings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_portfolio_holdings_updated_at
before update on public.portfolio_holdings
for each row
execute function public.set_portfolio_holdings_updated_at();
