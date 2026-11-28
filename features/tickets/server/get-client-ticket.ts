import "server-only";

import type { ClientTicketDetail } from "@/features/tickets/types/ticket-detail";
import { normalizeEmail } from "@/lib/client-token";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function getClientTicket(ticketNumber: string, verifiedEmail: string) {
  const { data, error } = await getSupabaseServerClient()
    .rpc("get_client_ticket_detail", {
      p_ticket_number: ticketNumber,
      p_email: normalizeEmail(verifiedEmail),
    })
    .overrideTypes<ClientTicketDetail | null, { merge: false }>();
  if (error) throw error;
  return data;
}
