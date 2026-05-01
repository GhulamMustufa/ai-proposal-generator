-- Application tracker: proposal status
alter table public.proposals
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'sent', 'interview', 'won', 'lost'));

-- User profile fields for AI personalization
alter table public.user_preferences
  add column if not exists display_name  text,
  add column if not exists bio           text,
  add column if not exists skills        text,
  add column if not exists hourly_rate   text,
  add column if not exists experience_years smallint;
