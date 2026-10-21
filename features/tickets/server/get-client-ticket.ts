import "server-only";

import type { ClientTicketDetail } from "@/features/tickets/types/ticket-detail";
import { normalizeEmail } from "@/lib/client-token";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TICKET_DETAIL_SELECT = `
  id,
  ticket_number,
  full_name,
  email,
  user_type,
  service,
  subject,
  description,
  priority,
  status,
  consent_given,
  created_at,
  updated_at,
  messages (
    sender_type,
    body,
    created_at
  ),
  attachments (
    file_name,
    file_type,
    file_size
  )
`;

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function getClientTicket(
  ticketNumber: string,
  verifiedEmail: string,
): Promise<ClientTicketDetail | null> {
  const emailPattern = escapeLikePattern(normalizeEmail(verifiedEmail));
  const { data, error } = await getSupabaseServerClient()
    .from("tickets")
    .select(TICKET_DETAIL_SELECT)
    .eq("ticket_number", ticketNumber)
    .ilike("email", emailPattern)
    .order("created_at", { referencedTable: "messages", ascending: true })
    .maybeSingle();

  if (error) throw error;
  return data;
}
