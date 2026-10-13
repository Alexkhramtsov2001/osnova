-- Portfolio-only submissions. No contact details or free-form visitor text are stored.
create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  client_request_id uuid not null unique,
  created_at timestamptz not null default now(),
  project_number text check (project_number in ('01', '02', '03', '04', '05', '06', '07', '08')),
  project_type text not null check (project_type in ('standard', 'custom', 'clientDrawings')),
  region text not null check (region in ('central', 'northwest', 'south', 'ural', 'siberia', 'farEast')),
  area numeric(6, 1) not null check (area between 30 and 1000),
  construction_mode text not null check (construction_mode in ('turnkey', 'stages')),
  stage_ids text[] not null check (
    cardinality(stage_ids) between 1 and 8
    and stage_ids <@ array[
      'foundation', 'walls', 'roof', 'windows-doors', 'facade',
      'engineering', 'interior', 'completion'
    ]::text[]
  ),
  estimate_total bigint not null check (estimate_total between 1 and 1000000000000),
  data_version text not null check (data_version = 'demo-2026.10.12-1')
);

create index if not exists demo_requests_created_at_idx on public.demo_requests (created_at desc);
alter table public.demo_requests enable row level security;
revoke all on public.demo_requests from public, anon, authenticated;
grant select, insert on public.demo_requests to service_role;

-- The browser can call only this bounded operation. The table itself stays private.
create or replace function public.submit_demo_request(
  p_client_request_id uuid,
  p_project_number text,
  p_project_type text,
  p_region text,
  p_area numeric,
  p_construction_mode text,
  p_stage_ids text[],
  p_estimate_total bigint,
  p_data_version text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_id uuid;
begin
  if p_client_request_id is null then
    raise exception 'Missing request ID';
  end if;

  -- Serialize the daily quota check to limit accidental or automated flooding.
  perform pg_catalog.pg_advisory_xact_lock(20261013, 1);
  select id into request_id from public.demo_requests
    where client_request_id = p_client_request_id;
  if request_id is not null then
    return request_id;
  end if;

  if (select count(*) from public.demo_requests
      where created_at >= pg_catalog.date_trunc('day', pg_catalog.now())
        and created_at < pg_catalog.date_trunc('day', pg_catalog.now()) + interval '1 day') >= 100 then
    raise exception 'Daily demo limit reached';
  end if;

  insert into public.demo_requests (
    client_request_id, project_number, project_type, region, area,
    construction_mode, stage_ids, estimate_total, data_version
  ) values (
    p_client_request_id, p_project_number, p_project_type, p_region, p_area,
    p_construction_mode, p_stage_ids, p_estimate_total, p_data_version
  ) returning id into request_id;
  return request_id;
end;
$$;

revoke all on function public.submit_demo_request(
  uuid, text, text, text, numeric, text, text[], bigint, text
) from public;
grant execute on function public.submit_demo_request(
  uuid, text, text, text, numeric, text, text[], bigint, text
) to anon, authenticated;
