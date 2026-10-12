begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'rls_user_a@example.com', 'x', now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"مستخدم أ"}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'rls_user_b@example.com', 'x', now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"مستخدم ب"}', now(), now()
  );

insert into public.conversations (id, user_id, model)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'test-model');

insert into public.messages (conversation_id, user_id, role, content)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'user', 'رسالة خاصة بالمستخدم أ');

insert into public.usage_records (user_id, request_status, total_tokens)
values ('11111111-1111-1111-1111-111111111111', 'ok', 10);

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","app_metadata":{"role":"user"}}';

do $$
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'RLS: user B can read % profiles, expected only own', (select count(*) from public.profiles);
  end if;
end;
$$;

do $$
begin
  if (select count(*) from public.messages) <> 0 then
    raise exception 'RLS: user B can read messages of user A';
  end if;
end;
$$;

do $$
begin
  if (select count(*) from public.conversations) <> 0 then
    raise exception 'RLS: user B can read conversations of user A';
  end if;
end;
$$;

do $$
begin
  if (select count(*) from public.usage_records) <> 0 then
    raise exception 'RLS: user B can read usage records of user A';
  end if;
end;
$$;

do $$
begin
  begin
    update public.profiles set role = 'admin' where id = '22222222-2222-2222-2222-222222222222';
    raise exception 'RLS: user B changed own role to admin';
  exception
    when others then
      if sqlerrm like 'RLS:%' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    update public.profiles set full_name = 'مسموح' where id = '22222222-2222-2222-2222-222222222222';
  exception
    when others then
      raise exception 'RLS: user B cannot update own display fields: %', sqlerrm;
  end;
end;
$$;

reset role;
set local role anon;
set local request.jwt.claims = '{}';

do $$
begin
  begin
    perform count(*) from public.profiles;
    raise exception 'RLS: anon can read profiles';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;

reset role;
rollback;
