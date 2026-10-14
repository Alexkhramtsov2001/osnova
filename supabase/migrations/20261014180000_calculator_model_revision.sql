-- Existing snapshots stay readable. Accept the new portfolio model without changing access rights.
begin;
alter table public.demo_requests
  drop constraint if exists demo_requests_data_version_check;

alter table public.demo_requests
  add constraint demo_requests_data_version_check
  check (data_version in ('demo-2026.10.12-1', 'demo-2026.10.14-1', 'demo-2026.10.14-2'));
commit;
