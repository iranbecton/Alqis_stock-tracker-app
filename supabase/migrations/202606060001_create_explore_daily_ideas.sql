create table if not exists public.explore_daily_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generated_date date not null,
  ideas jsonb not null default '[]',
  fit_scores jsonb not null default '{}',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  unique(user_id, generated_date)
);

alter table public.explore_daily_ideas enable row level security;

drop policy if exists "Users can read own ideas" on public.explore_daily_ideas;
create policy "Users can read own ideas"
  on public.explore_daily_ideas for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own ideas" on public.explore_daily_ideas;
create policy "Users can insert own ideas"
  on public.explore_daily_ideas for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own ideas" on public.explore_daily_ideas;
create policy "Users can update own ideas"
  on public.explore_daily_ideas for update
  using (auth.uid() = user_id);

create index if not exists explore_daily_ideas_user_date_idx
  on public.explore_daily_ideas (user_id, generated_date desc);

create index if not exists explore_daily_ideas_expires_idx
  on public.explore_daily_ideas (expires_at);
