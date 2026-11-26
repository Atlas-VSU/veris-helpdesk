import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase-server";

// Keep embedded ranges within the PostgREST max_rows configured in supabase/config.toml.
const THREAD_PAGE_SIZE = 1000;

function getTicketPage(ticketNumber: string, offset: number) {
  const end = offset + THREAD_PAGE_SIZE - 1;
  return getSupabaseServerClient()
    .from("tickets")
    .select(`
      id, ticket_number, full_name, email, user_type, service, subject,
      description, priority, status, consent_given, created_at, updated_at,
      messages(id, sender_type, body, created_at),
      attachments(id, message_id, file_name, file_type, file_size)
    `)
    .eq("ticket_number", ticketNumber)
    .order("created_at", { referencedTable: "messages", ascending: true })
    .order("id", { referencedTable: "messages", ascending: true })
    .order("created_at", { referencedTable: "attachments", ascending: true })
    .order("id", { referencedTable: "attachments", ascending: true })
    .range(offset, end, { referencedTable: "messages" })
    .range(offset, end, { referencedTable: "attachments" })
    .maybeSingle();
}

export async function getAdminTicket(ticketNumber: string) {
  const { data: ticket, error } = await getTicketPage(ticketNumber, 0);
  if (error) throw error;
  if (!ticket) return null;

  let page = ticket;
  let offset = 0;
  while (page.messages.length === THREAD_PAGE_SIZE || page.attachments.length === THREAD_PAGE_SIZE) {
    offset += THREAD_PAGE_SIZE;
    const { data, error } = await getTicketPage(ticketNumber, offset);
    if (error) throw error;
    if (!data) return null;

    ticket.messages.push(...data.messages);
    ticket.attachments.push(...data.attachments);
    page = data;
  }
  return ticket;
}
