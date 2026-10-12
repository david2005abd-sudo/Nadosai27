create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  type text not null check (type in ('system', 'quota', 'security')),
  action_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_user_idx
on public.notifications (user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

create policy notifications_select_own
on public.notifications for select
to authenticated
using (user_id = (select auth.uid()));

create policy notifications_update_own
on public.notifications for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (is_read, read_at) on public.notifications to authenticated;
