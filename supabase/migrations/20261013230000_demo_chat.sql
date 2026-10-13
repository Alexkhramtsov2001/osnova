-- Only predefined topic codes are stored. No message text or visitor identifiers.
create table if not exists public.demo_chat_turns (
  id uuid primary key default gen_random_uuid(),
  client_turn_id uuid not null unique,
  created_at timestamptz not null default now(),
  topic_code text not null check (
    topic_code in ('choose_project', 'estimate', 'timeline', 'contact_author')
  )
);

create index if not exists demo_chat_turns_created_at_idx
  on public.demo_chat_turns (created_at desc);
alter table public.demo_chat_turns enable row level security;
revoke all on public.demo_chat_turns from public, anon, authenticated;
grant select, insert on public.demo_chat_turns to service_role;

create or replace function public.submit_demo_chat_turn(
  p_client_turn_id uuid,
  p_topic_code text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  turn_id uuid;
begin
  if p_client_turn_id is null or p_topic_code not in
    ('choose_project', 'estimate', 'timeline', 'contact_author') then
    raise exception 'Invalid demo chat turn';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(20261013, 2);
  select id into turn_id from public.demo_chat_turns
    where client_turn_id = p_client_turn_id and topic_code = p_topic_code;
  if turn_id is not null then
    return turn_id;
  end if;

  if exists (select 1 from public.demo_chat_turns
      where client_turn_id = p_client_turn_id) then
    raise exception 'Turn ID already used';
  end if;

  if (select count(*) from public.demo_chat_turns
      where created_at >= pg_catalog.date_trunc('day', pg_catalog.now())
        and created_at < pg_catalog.date_trunc('day', pg_catalog.now()) + interval '1 day') >= 100 then
    raise exception 'Daily demo chat limit reached';
  end if;

  insert into public.demo_chat_turns (client_turn_id, topic_code)
    values (p_client_turn_id, p_topic_code)
    returning id into turn_id;
  return turn_id;
end;
$$;

revoke all on function public.submit_demo_chat_turn(uuid, text) from public;
grant execute on function public.submit_demo_chat_turn(uuid, text) to anon, authenticated;
