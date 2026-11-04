import { NextResponse } from "next/server";
import { getClientEmail } from "@/lib/client-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { PublicTicket } from "@/features/tickets/types/ticket-list";
import {
  escapeLikePattern,
  isTicketStatus,
} from "@/features/tickets/utils/ticket-list";
import { errorResponse, handleApiError } from "@/lib/api-error";

const PRIVATE_RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  try {
    const verifiedEmail = await getClientEmail();
    if (!verifiedEmail) {
      return errorResponse(401, "Unauthorized", {
        headers: PRIVATE_RESPONSE_HEADERS,
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim() ?? "";
    const search = searchParams.get("q")?.trim().toLowerCase() ?? "";

    if (status && !isTicketStatus(status)) {
      return errorResponse(400, "Invalid ticket status", {
        headers: PRIVATE_RESPONSE_HEADERS,
      });
    }

    const requestedStatus = status && isTicketStatus(status) ? status : undefined;
    let query = getSupabaseServerClient()
      .from("tickets")
      .select("id, ticket_number, subject, description, priority, status, service, created_at, updated_at")
      .ilike("email", escapeLikePattern(verifiedEmail))
      .order("created_at", { ascending: false });

    if (requestedStatus) {
      query = query.eq("status", requestedStatus);
    }

    const { data, error } = await query;
    if (error) throw error;
    const publicTickets = (data ?? []) as PublicTicket[];

    const tickets = search
      ? publicTickets.filter((ticket) =>
          [ticket.subject, ticket.ticket_number].some((value) =>
            value.toLowerCase().includes(search),
          ),
        )
      : publicTickets;

    return NextResponse.json(
      { data: tickets },
      { headers: PRIVATE_RESPONSE_HEADERS },
    );
  } catch (error) {
    return handleApiError(error, {
      context: "Client ticket list error",
      fallbackMessage: "Unable to load tickets",
      headers: PRIVATE_RESPONSE_HEADERS,
    });
  }
}
