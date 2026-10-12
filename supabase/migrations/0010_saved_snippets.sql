create table public.saved_snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) <= 120),
  content text not null,
  source_message_id uuid references public.messages (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_snippets_user_idx
on public.saved_snippets (user_id, created_at desc);

create trigger saved_snippets_set_updated_at
before update on public.saved_snippets
for each row execute function public.set_updated_at();

alter table public.saved_snippets enable row level security;

create policy saved_snippets_select_own
on public.saved_snippets for select
to authenticated
using (user_id = (select auth.uid()));

create policy saved_snippets_insert_own
on public.saved_snippets for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy saved_snippets_update_own
on public.saved_snippets for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy saved_snippets_delete_own
on public.saved_snippets for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.saved_snippets from anon, authenticated;
grant select, insert, update, delete on public.saved_snippets to authenticated;
