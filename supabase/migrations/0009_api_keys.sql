create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index api_keys_user_idx
on public.api_keys (user_id, created_at desc);

alter table public.api_keys enable row level security;

create policy api_keys_select_own
on public.api_keys for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.api_keys from anon, authenticated;
grant select (id, user_id, name, key_prefix, last_used_at, expires_at, revoked_at, created_at)
on public.api_keys to authenticated;
