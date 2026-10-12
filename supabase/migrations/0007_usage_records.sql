create table public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  completion_tokens integer not null default 0 check (completion_tokens >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  request_status text not null check (request_status in ('ok', 'error', 'aborted', 'limited')),
  request_duration_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index usage_records_user_created_idx
on public.usage_records (user_id, created_at desc);

alter table public.usage_records enable row level security;

create policy usage_records_select_own
on public.usage_records for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.usage_records from anon, authenticated;
grant select on public.usage_records to authenticated;
