create table if not exists public.stock_explanations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  company_name text,
  timeframe text not null default '1D',
  summary text not null,
  confidence_score numeric,
  confidence_band text,
  confidence_label text,
  source_count integer,
  key_factors jsonb,
  counterevidence jsonb,
  data_health jsonb,
  provider_status jsonb,
  explanation_hash text,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint stock_explanations_unique_hash unique (user_id, ticker, timeframe, explanation_hash)
);

create index if not exists stock_explanations_user_created_idx
  on public.stock_explanations (user_id, created_at desc);

create index if not exists stock_explanations_ticker_created_idx
  on public.stock_explanations (ticker, created_at desc);

alter table public.stock_explanations enable row level security;

drop policy if exists "Users can select their own stock explanations" on public.stock_explanations;
create policy "Users can select their own stock explanations"
  on public.stock_explanations
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own stock explanations" on public.stock_explanations;
create policy "Users can insert their own stock explanations"
  on public.stock_explanations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own stock explanations" on public.stock_explanations;
create policy "Users can update their own stock explanations"
  on public.stock_explanations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own stock explanations" on public.stock_explanations;
create policy "Users can delete their own stock explanations"
  on public.stock_explanations
  for delete
  using (auth.uid() = user_id);
