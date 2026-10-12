create table public.message_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  vote smallint not null check (vote in (1, -1)),
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

alter table public.message_feedback enable row level security;

create policy message_feedback_select_own
on public.message_feedback for select
to authenticated
using (user_id = (select auth.uid()));

create policy message_feedback_insert_own
on public.message_feedback for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_id and c.user_id = (select auth.uid())
  )
);

create policy message_feedback_update_own
on public.message_feedback for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy message_feedback_delete_own
on public.message_feedback for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.message_feedback from anon, authenticated;
grant select, insert, update, delete on public.message_feedback to authenticated;
