-- Return one scalar so PostgREST's row cap does not truncate either array.
create function public.get_admin_ticket_detail(p_ticket_number text)
returns jsonb
language sql stable security invoker
set search_path = ''
as $$
  select to_jsonb(detail)
  from (
    select t.id, t.ticket_number, t.full_name, t.email, t.user_type, t.service,
           t.subject, t.description, t.priority, t.status, t.consent_given,
           t.created_at, t.updated_at,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', m.id, 'sender_type', m.sender_type,
               'body', m.body, 'created_at', m.created_at
             ) order by m.created_at, m.id)
             from public.messages m where m.ticket_id = t.id
           ), '[]'::jsonb) as messages,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', a.id, 'message_id', a.message_id, 'file_name', a.file_name,
               'file_type', a.file_type, 'file_size', a.file_size
             ) order by a.created_at, a.id)
             from public.attachments a where a.ticket_id = t.id
           ), '[]'::jsonb) as attachments
    from public.tickets t
    where t.ticket_number = p_ticket_number
  ) detail;
$$;

revoke all on function public.get_admin_ticket_detail(text) from public, anon, authenticated;
grant execute on function public.get_admin_ticket_detail(text) to service_role;
