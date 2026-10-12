create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  ip_hash text,
  user_agent text check (user_agent is null or char_length(user_agent) <= 200),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx
on public.audit_logs (created_at desc);

create index audit_logs_actor_idx
on public.audit_logs (user_id, created_at desc);

alter table public.audit_logs enable row level security;

revoke all on public.audit_logs from anon, authenticated;
