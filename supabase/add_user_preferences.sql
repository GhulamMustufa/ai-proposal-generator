create table if not exists public.user_preferences (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  default_keywords text not null default '',
  updated_at      timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "users can read own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);
