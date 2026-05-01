create extension if not exists "pgcrypto";

create table if not exists public.api_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address text not null,
  endpoint text not null,
  request_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists api_usage_events_user_endpoint_created_idx
  on public.api_usage_events (user_id, endpoint, created_at desc);

create index if not exists api_usage_events_ip_endpoint_created_idx
  on public.api_usage_events (ip_address, endpoint, created_at desc);

create table if not exists public.ai_request_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_hash text not null,
  idempotency_key text,
  generated_proposal text not null,
  proposal_id uuid references public.proposals(id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists ai_request_cache_user_request_hash_unique
  on public.ai_request_cache (user_id, request_hash);

create index if not exists ai_request_cache_user_idempotency_idx
  on public.ai_request_cache (user_id, idempotency_key, created_at desc);

create index if not exists ai_request_cache_expires_idx
  on public.ai_request_cache (expires_at);
