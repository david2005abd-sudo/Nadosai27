create table public.rate_limit_windows (
  bucket_key text not null,
  window_start timestamptz not null,
  count integer not null default 0 check (count >= 0),
  primary key (bucket_key, window_start)
);

alter table public.rate_limit_windows enable row level security;

revoke all on public.rate_limit_windows from anon, authenticated;

create or replace function public.check_rate_limit(
  p_bucket text,
  p_window_seconds integer,
  p_max integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  delete from public.rate_limit_windows
  where window_start < now() - interval '1 day';

  insert into public.rate_limit_windows (bucket_key, window_start, count)
  values (p_bucket, v_window_start, 1)
  on conflict (bucket_key, window_start)
  do update set count = public.rate_limit_windows.count + 1
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated, service_role;
