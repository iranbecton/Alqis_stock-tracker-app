create table if not exists public.user_investor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  investment_knowledge_level text not null,
  market_experience text not null,
  explanation_depth text not null default 'balanced',
  market_interests text[] not null default '{}',
  onboarding_completed boolean not null default false,
  disclaimer_acknowledged boolean not null default false,
  disclaimer_acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_investor_profiles_knowledge_check
    check (investment_knowledge_level in ('new', 'basic', 'comfortable', 'advanced')),
  constraint user_investor_profiles_experience_check
    check (market_experience in ('starting', 'lt_1y', '1_3y', '3_7y', '7y_plus')),
  constraint user_investor_profiles_depth_check
    check (explanation_depth in ('simple', 'balanced', 'detailed'))
);

alter table public.user_investor_profiles enable row level security;

drop policy if exists "Users can select their own investor profile" on public.user_investor_profiles;
create policy "Users can select their own investor profile"
on public.user_investor_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own investor profile" on public.user_investor_profiles;
create policy "Users can insert their own investor profile"
on public.user_investor_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own investor profile" on public.user_investor_profiles;
create policy "Users can update their own investor profile"
on public.user_investor_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists user_investor_profiles_user_id_idx
on public.user_investor_profiles(user_id);

create or replace function public.set_user_investor_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_investor_profiles_updated_at on public.user_investor_profiles;
create trigger set_user_investor_profiles_updated_at
before update on public.user_investor_profiles
for each row
execute function public.set_user_investor_profiles_updated_at();
