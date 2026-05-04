create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  default_ticker text default 'NVDA',
  default_chart_range text default '1D',
  experience_level text default 'beginner',
  brief_focus text default 'balanced',
  preferred_sectors text[] default '{}',
  show_education_tips boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_default_chart_range_check
    check (default_chart_range in ('1D', '5D', '1M')),
  constraint user_preferences_experience_level_check
    check (experience_level in ('beginner', 'intermediate', 'advanced')),
  constraint user_preferences_brief_focus_check
    check (brief_focus in ('balanced', 'watchlist', 'market_context', 'education'))
);

alter table public.user_preferences enable row level security;

drop policy if exists "Users can select their own preferences" on public.user_preferences;
create policy "Users can select their own preferences"
on public.user_preferences
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own preferences" on public.user_preferences;
create policy "Users can insert their own preferences"
on public.user_preferences
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own preferences" on public.user_preferences;
create policy "Users can update their own preferences"
on public.user_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own preferences" on public.user_preferences;
create policy "Users can delete their own preferences"
on public.user_preferences
for delete
using (auth.uid() = user_id);

create index if not exists user_preferences_user_id_idx
on public.user_preferences(user_id);

create or replace function public.set_user_preferences_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at
before update on public.user_preferences
for each row
execute function public.set_user_preferences_updated_at();
