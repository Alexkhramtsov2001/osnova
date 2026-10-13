-- Private inbox for real portfolio inquiries. Creating the table does not enable submissions.
-- Only a server-side Edge Function may write through a Supabase secret key.
create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  client_request_id uuid not null unique,
  created_at timestamptz not null default now(),
  contact_name text not null check (char_length(btrim(contact_name)) between 2 and 100),
  contact_email text not null check (char_length(contact_email) between 5 and 254),
  message text not null check (char_length(btrim(message)) between 10 and 4000),
  project_numbers text[] not null default '{}'::text[]
    check (cardinality(project_numbers) <= 3),
  estimate_summary text check (char_length(estimate_summary) <= 20000),
  consent_version text not null check (char_length(consent_version) between 1 and 80),
  consent_at timestamptz not null,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'closed')),
  notification_status text not null default 'pending'
    check (notification_status in ('pending', 'sent', 'failed')),
  notification_attempted_at timestamptz
);

create index contact_requests_created_at_idx
  on public.contact_requests (created_at desc);
create index contact_requests_status_idx
  on public.contact_requests (status, created_at desc);

alter table public.contact_requests enable row level security;

-- No anon/authenticated policies exist, and neither browser role has table privileges.
revoke all on public.contact_requests from public, anon, authenticated;
grant select, insert, update, delete on public.contact_requests to service_role;
