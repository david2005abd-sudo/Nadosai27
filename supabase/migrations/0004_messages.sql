create extension if not exists pg_trgm;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  model text,
  client_message_id uuid,
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  completion_tokens integer not null default 0 check (completion_tokens >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  superseded boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index messages_conversation_client_id_key
on public.messages (conversation_id, client_message_id)
where client_message_id is not null;

create index messages_conversation_created_idx
on public.messages (conversation_id, created_at, id);

create index messages_content_trgm_idx
on public.messages using gin (content gin_trgm_ops);

alter table public.messages enable row level security;

create policy messages_select_own
on public.messages for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
