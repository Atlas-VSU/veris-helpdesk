import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function getAdminTicket(ticketNumber: string) {
  const { data, error } = await getSupabaseServerClient()
    .rpc("get_admin_ticket_detail", { p_ticket_number: ticketNumber });
  if (error) throw error;
  return data;
}
