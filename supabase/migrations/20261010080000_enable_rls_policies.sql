-- ============================================================
-- Enable Row Level Security (RLS) on all core MVP tables.
-- Client and admin authentication is enforced on the Next.js
-- server (via httpOnly JWT cookies client_session / admin_session)
-- using the service-role Supabase client. Enabling RLS blocks
-- direct public (anon / authenticated) PostgREST access while
-- permitting server-side service_role operations.
-- ============================================================

alter table public.admins enable row level security;
alter table public.tickets enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.otp_verifications enable row level security;
alter table public.notifications enable row level security;

create policy "service_role_full_access_admins"
  on public.admins
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_full_access_tickets"
  on public.tickets
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_full_access_messages"
  on public.messages
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_full_access_attachments"
  on public.attachments
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_full_access_otp_verifications"
  on public.otp_verifications
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_full_access_notifications"
  on public.notifications
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_full_access_attachments_bucket"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'attachments')
  with check (bucket_id = 'attachments');
