create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'محادثة جديدة' check (char_length(title) <= 120),
  model text not null,
  system_prompt text,
  is_archived boolean not null default false,
  is_pinned boolean not null default false,
  message_count integer not null default 0,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_user_list_idx
on public.conversations (user_id, is_archived, is_pinned desc, last_message_at desc nulls last);

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;

create policy conversations_select_own
on public.conversations for select
to authenticated
using (user_id = (select auth.uid()));

create policy conversations_update_own
on public.conversations for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy conversations_delete_own
on public.conversations for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.conversations from anon, authenticated;
grant select, update, delete on public.conversations to authenticated;
