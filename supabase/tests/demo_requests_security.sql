-- Run in SQL Editor after applying the demo migration.
do $$
begin
  if not exists (
    select 1 from pg_class
    where oid = 'public.demo_requests'::regclass and relrowsecurity
  ) then
    raise exception 'demo_requests must have RLS enabled';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'demo_requests'
  ) then
    raise exception 'demo_requests must have no browser policies';
  end if;

  if has_table_privilege('anon', 'public.demo_requests', 'SELECT')
    or has_table_privilege('anon', 'public.demo_requests', 'INSERT')
    or has_table_privilege('authenticated', 'public.demo_requests', 'SELECT')
    or has_table_privilege('authenticated', 'public.demo_requests', 'INSERT') then
    raise exception 'browser roles must not read or write demo_requests';
  end if;

  if not has_function_privilege('anon',
    'public.submit_demo_request(uuid,text,text,text,numeric,text,text[],bigint,text)',
    'EXECUTE') then
    raise exception 'anon must be able to submit a bounded demo request';
  end if;
end;
$$;
