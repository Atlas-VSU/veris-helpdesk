import { NextResponse } from "next/server";
import { getClientEmail } from "@/lib/client-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { PublicTicket } from "@/features/tickets/types/ticket-list";
import {
  escapeLikePattern,
  isTicketStatus,
} from "@/features/tickets/utils/ticket-list";

const PRIVATE_RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  try {
    const verifiedEmail = await getClientEmail();
    if (!verifiedEmail) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: PRIVATE_RESPONSE_HEADERS },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim() ?? "";
    const search = searchParams.get("q")?.trim().toLowerCase() ?? "";

    if (status && !isTicketStatus(status)) {
      return NextResponse.json(
        { error: "Invalid ticket status" },
        { status: 400, headers: PRIVATE_RESPONSE_HEADERS },
      );
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
    console.error("Client ticket list error:", error);
    return NextResponse.json(
      { error: "Unable to load tickets" },
      { status: 500, headers: PRIVATE_RESPONSE_HEADERS },
    );
  }
}
