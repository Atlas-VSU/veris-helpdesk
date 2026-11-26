-- ============================================================
-- Ensure reply attachments always match their parent message's
-- ticket_id and provide an atomic transaction for saving an
-- admin reply and its attachment metadata together after
-- storage upload succeeds.
-- ============================================================

alter table public.messages
  add constraint messages_id_ticket_id_unique unique (id, ticket_id);

alter table public.attachments
  add constraint attachments_message_ticket_fkey
  foreign key (message_id, ticket_id)
  references public.messages (id, ticket_id)
  on delete cascade;

create or replace function public.create_admin_reply_with_attachment(
  p_ticket_id uuid,
  p_body text,
  p_admin_id uuid default null,
  p_message_id uuid default gen_random_uuid(),
  p_file_name text default null,
  p_file_type text default null,
  p_file_size integer default null,
  p_storage_path text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_message public.messages%rowtype;
  v_attachment public.attachments%rowtype;
  v_attachments jsonb := '[]'::jsonb;
begin
  insert into public.messages (id, ticket_id, sender_type, admin_id, body)
  values (coalesce(p_message_id, gen_random_uuid()), p_ticket_id, 'admin', p_admin_id, p_body)
  returning * into v_message;

  if p_storage_path is not null then
    if p_file_name is null or p_file_type is null or p_file_size is null then
      raise exception 'Attachment metadata is incomplete';
    end if;

    insert into public.attachments (
      ticket_id,
      message_id,
      file_name,
      file_type,
      file_size,
      storage_path
    )
    values (
      v_message.ticket_id,
      v_message.id,
      p_file_name,
      p_file_type,
      p_file_size,
      p_storage_path
    )
    returning * into v_attachment;

    v_attachments := jsonb_build_array(
      jsonb_build_object(
        'id', v_attachment.id,
        'message_id', v_attachment.message_id,
        'file_name', v_attachment.file_name,
        'file_type', v_attachment.file_type,
        'file_size', v_attachment.file_size
      )
    );
  end if;

  return jsonb_build_object(
    'id', v_message.id,
    'ticket_id', v_message.ticket_id,
    'sender_type', v_message.sender_type,
    'body', v_message.body,
    'created_at', v_message.created_at,
    'attachments', v_attachments
  );
end;
$$;

revoke all on function public.create_admin_reply_with_attachment(
  uuid,
  text,
  uuid,
  uuid,
  text,
  text,
  integer,
  text
) from public, anon, authenticated;

grant execute on function public.create_admin_reply_with_attachment(
  uuid,
  text,
  uuid,
  uuid,
  text,
  text,
  integer,
  text
) to service_role;
