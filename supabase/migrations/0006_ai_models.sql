create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  provider text not null,
  description text,
  context_window integer check (context_window is null or context_window > 0),
  is_enabled boolean not null default true,
  is_free boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ai_models_set_updated_at
before update on public.ai_models
for each row execute function public.set_updated_at();

alter table public.ai_models enable row level security;

create policy ai_models_select_enabled_or_admin
on public.ai_models for select
to authenticated
using (is_enabled or public.is_admin());

revoke all on public.ai_models from anon, authenticated;
grant select on public.ai_models to authenticated;
