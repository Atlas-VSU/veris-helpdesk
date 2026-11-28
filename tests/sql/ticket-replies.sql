-- Run against a migrated test database with psql -v ON_ERROR_STOP=1 -f.
begin;
do $$
declare
  ticket public.tickets;
  admin_id uuid := gen_random_uuid();
  client_reply record;
  admin_reply jsonb;
  detail jsonb;
begin
  insert into public.admins (id,email,full_name,password_hash)
  values (admin_id, admin_id || '@example.invalid', 'Reply Test', 'test-only');
  insert into public.tickets (email, full_name, user_type, service, subject, description, priority)
  values ('Owner_Test@example.invalid', 'Owner', 'student', 'Billing', 'Reply test', 'Fixture', 'low')
  returning * into ticket;

  if exists (select from public.create_client_ticket_reply(ticket.ticket_number, 'owner%test@example.invalid', 'foreign'))
    or public.get_client_ticket_detail(ticket.ticket_number, 'owner%test@example.invalid') is not null then
    raise exception 'Different owner could access the ticket';
  end if;
  select * into strict client_reply
    from public.create_client_ticket_reply(ticket.ticket_number, lower(ticket.email), 'Client reply');
  select public.create_admin_reply_with_attachment(ticket.id, 'Admin reply', admin_id,
    gen_random_uuid(), 'test.pdf', 'application/pdf', 8, 'test/reply.pdf') into admin_reply;

  foreach detail in array array[public.get_client_ticket_detail(ticket.ticket_number, lower(ticket.email)),
                                public.get_admin_ticket_detail(ticket.ticket_number)] loop
    if detail is null or jsonb_array_length(detail->'messages') <> 2
      or not (detail->'messages' @> jsonb_build_array(jsonb_build_object(
        'id', client_reply.id, 'body', 'Client reply', 'sender_type', 'client')))
      or not (detail->'messages' @> jsonb_build_array(jsonb_build_object(
        'id', admin_reply->>'id', 'body', 'Admin reply', 'sender_type', 'admin')))
      or detail->'attachments' is distinct from admin_reply->'attachments' then
      raise exception 'Saved replies or linked attachment did not round-trip';
    end if;
  end loop;

  update public.tickets set status = 'closed' where id = ticket.id;
  begin
    perform public.create_client_ticket_reply(ticket.ticket_number, ticket.email, 'Late client reply');
    raise exception 'Closed ticket accepted a client reply';
  exception when sqlstate 'VR400' then null;
  end;
  begin
    perform public.create_admin_reply_with_attachment(ticket.id, 'Late admin reply', admin_id);
    raise exception 'Closed ticket accepted an admin reply';
  exception when sqlstate 'VR400' then null;
  end;
  if (select count(*) from public.messages m where m.ticket_id = ticket.id) <> 2 then
    raise exception 'Rejected reply persisted';
  end if;
end;
$$;
rollback;
