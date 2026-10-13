-- Run in SQL Editor after applying the demo chat migration.
do $$
begin
  if not exists (
    select 1 from pg_class
    where oid = 'public.demo_chat_turns'::regclass and relrowsecurity
  ) then
    raise exception 'demo_chat_turns must have RLS enabled';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'demo_chat_turns'
  ) then
    raise exception 'demo_chat_turns must have no browser policies';
  end if;

  if has_table_privilege('anon', 'public.demo_chat_turns', 'SELECT')
    or has_table_privilege('anon', 'public.demo_chat_turns', 'INSERT')
    or has_table_privilege('authenticated', 'public.demo_chat_turns', 'SELECT')
    or has_table_privilege('authenticated', 'public.demo_chat_turns', 'INSERT') then
    raise exception 'browser roles must not read or write demo_chat_turns';
  end if;

  if not has_function_privilege('anon',
    'public.submit_demo_chat_turn(uuid,text)', 'EXECUTE') then
    raise exception 'anon must be able to submit a bounded demo chat turn';
  end if;
end;
$$;
