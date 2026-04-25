create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  company_name text,
  created_at timestamptz not null default now(),
  constraint watchlist_items_user_ticker_key unique (user_id, ticker),
  constraint watchlist_items_ticker_format check (ticker = upper(ticker) and ticker ~ '^[A-Z][A-Z0-9.-]{0,9}$')
);

alter table public.watchlist_items enable row level security;

create policy "Users can select their own watchlist items"
  on public.watchlist_items
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own watchlist items"
  on public.watchlist_items
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own watchlist items"
  on public.watchlist_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own watchlist items"
  on public.watchlist_items
  for delete
  using (auth.uid() = user_id);

create index if not exists watchlist_items_user_created_at_idx
  on public.watchlist_items (user_id, created_at desc);
