create table public.system_settings (
  id integer primary key check (id = 1),
  daily_message_limit integer not null default 40 check (daily_message_limit > 0),
  daily_token_limit integer not null default 80000 check (daily_token_limit > 0),
  default_model text not null,
  updated_at timestamptz not null default now()
);

create trigger system_settings_set_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();

insert into public.system_settings (id, default_model)
values (1, 'gpt-4o-mini')
on conflict (id) do nothing;

alter table public.system_settings enable row level security;

create policy system_settings_select_admin
on public.system_settings for select
to authenticated
using (public.is_admin());

revoke all on public.system_settings from anon, authenticated;
grant select on public.system_settings to authenticated;
