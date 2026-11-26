-- ============================================================
-- Single-statement dashboard ticket counts RPC for admins.
-- Computes total, urgent, and per-status counts in one MVCC
-- snapshot so concurrent status transitions cannot double-count
-- or omit tickets across separate requests.
-- ============================================================

create or replace function public.get_admin_dashboard_counts()
returns table (
  total_tickets bigint,
  urgent_tickets bigint,
  new_count bigint,
  open_count bigint,
  in_progress_count bigint,
  waiting_for_client_count bigint,
  resolved_count bigint,
  closed_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*)::bigint as total_tickets,
    count(*) filter (where priority = 'urgent')::bigint as urgent_tickets,
    count(*) filter (where status = 'new')::bigint as new_count,
    count(*) filter (where status = 'open')::bigint as open_count,
    count(*) filter (where status = 'in_progress')::bigint as in_progress_count,
    count(*) filter (where status = 'waiting_for_client')::bigint as waiting_for_client_count,
    count(*) filter (where status = 'resolved')::bigint as resolved_count,
    count(*) filter (where status = 'closed')::bigint as closed_count
  from public.tickets;
$$;

revoke all on function public.get_admin_dashboard_counts() from public, anon, authenticated;
grant execute on function public.get_admin_dashboard_counts() to service_role;
