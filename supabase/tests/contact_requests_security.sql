-- Run after applying the migration to a local or staging Supabase database.
-- These assertions must pass before enabling a public submission endpoint.
do $$
begin
  if not exists (
    select 1 from pg_class
    where oid = 'public.contact_requests'::regclass and relrowsecurity
  ) then
    raise exception 'contact_requests must have RLS enabled';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contact_requests'
  ) then
    raise exception 'contact_requests must not have browser-role policies';
  end if;

  if has_table_privilege('anon', 'public.contact_requests', 'SELECT')
    or has_table_privilege('anon', 'public.contact_requests', 'INSERT')
    or has_table_privilege('authenticated', 'public.contact_requests', 'SELECT')
    or has_table_privilege('authenticated', 'public.contact_requests', 'INSERT') then
    raise exception 'browser roles must not read or insert contact_requests';
  end if;

  if not has_table_privilege('service_role', 'public.contact_requests', 'SELECT')
    or not has_table_privilege('service_role', 'public.contact_requests', 'INSERT') then
    raise exception 'server role must read and insert contact_requests';
  end if;
end;
$$;
