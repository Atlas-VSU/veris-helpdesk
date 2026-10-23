import { NextResponse } from "next/server";
import { getClientEmail } from "@/lib/client-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { TicketStatus } from "@/types/database";

const ticketStatuses: TicketStatus[] = [
  "new",
  "open",
  "in_progress",
  "waiting_for_client",
  "resolved",
  "closed",
];

const PRIVATE_RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };

function isTicketStatus(value: string): value is TicketStatus {
  return ticketStatuses.includes(value as TicketStatus);
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

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
    const emailPattern = escapeLikePattern(verifiedEmail);
    let query = getSupabaseServerClient()
      .from("tickets")
      .select("*")
      .ilike("email", emailPattern)
      .order("created_at", { ascending: false });

    if (requestedStatus) {
      query = query.eq("status", requestedStatus);
    }

    const { data, error } = await query;
    if (error) throw error;

    const tickets = search
      ? data.filter((ticket) =>
          [ticket.subject, ticket.ticket_number].some((value) =>
            value.toLowerCase().includes(search),
          ),
        )
      : data;

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
