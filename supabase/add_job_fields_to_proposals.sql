alter table public.proposals
  add column if not exists job_title text,
  add column if not exists job_link  text;
