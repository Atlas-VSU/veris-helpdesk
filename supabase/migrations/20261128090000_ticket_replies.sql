-- Serialize a reply with a concurrent close, including FS-09's attachment RPC.
create function public.require_open_ticket_on_reply() returns trigger
language plpgsql set search_path = '' as $$
declare
  current_status public.ticket_status;
begin
  select status into current_status from public.tickets where id = new.ticket_id for share;
  if not found then
    raise exception using errcode = 'VR404', message = 'Ticket not found';
  elsif current_status = 'closed' then
    raise exception using errcode = 'VR400', message = 'Ticket is closed.';
  end if;
  return new;
end;
$$;

create trigger require_open_ticket before insert on public.messages
for each row execute function public.require_open_ticket_on_reply();

create function public.create_client_ticket_reply(p_ticket_number text, p_email text, p_body text)
returns table(id uuid, ticket_id uuid, body text, created_at timestamptz)
language sql security invoker set search_path = '' as $$
  with owned_ticket as (
    select t.id from public.tickets t
    where t.ticket_number = p_ticket_number and lower(t.email) = lower(p_email)
    for share
  )
  insert into public.messages as m (ticket_id, sender_type, body)
  select t.id, 'client', p_body from owned_ticket t
  returning m.id, m.ticket_id, m.body, m.created_at;
$$;

-- Scope the existing complete thread snapshot to the verified owner.
create function public.get_client_ticket_detail(p_ticket_number text, p_email text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select public.get_admin_ticket_detail(t.ticket_number)
  from public.tickets t
  where t.ticket_number = p_ticket_number and lower(t.email) = lower(p_email);
$$;

revoke all on function public.require_open_ticket_on_reply(),
  public.create_client_ticket_reply(text, text, text), public.get_client_ticket_detail(text, text)
  from public, anon, authenticated;
grant execute on function public.create_client_ticket_reply(text, text, text),
  public.get_client_ticket_detail(text, text) to service_role;
