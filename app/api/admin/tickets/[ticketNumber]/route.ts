import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { adminTicketUpdateSchema } from "@/features/admin/schemas/ticket";
import { getAdminTicket } from "@/features/admin/server/get-admin-ticket";
import { ticketNumberSchema } from "@/features/tickets/schemas/ticket";
import { ApiError, errorResponse, handleApiError, parseJsonBody } from "@/lib/api-error";

type TicketContext = { params: Promise<{ ticketNumber: string }> };
const privateHeaders = { "Cache-Control": "private, no-store" };

async function requireAdminTicketNumber(context: TicketContext) {
  if (!(await getAdminSession())) throw ApiError.unauthorized();
  const { ticketNumber } = await context.params;
  if (!ticketNumberSchema.safeParse(ticketNumber).success) {
    throw ApiError.badRequest("Invalid ticket number");
  }
  return ticketNumber;
}

export async function GET(_request: Request, context: TicketContext) {
  try {
    const ticketNumber = await requireAdminTicketNumber(context);
    const data = await getAdminTicket(ticketNumber);
    if (!data) throw ApiError.notFound("Ticket not found");
    return NextResponse.json({ data }, { headers: privateHeaders });
  } catch (error) {
    return handleApiError(error, {
      context: "Admin ticket retrieval error",
      fallbackMessage: "Unable to load ticket",
      headers: privateHeaders,
    });
  }
}

export async function PATCH(
  request: Request,
  context: TicketContext,
) {
  try {
    const ticketNumber = await requireAdminTicketNumber(context);
    const body = await parseJsonBody(request);
    const result = adminTicketUpdateSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(400, "Invalid ticket update");
    }

    const { data, error } = await getSupabaseServerClient()
      .from("tickets")
      .update(result.data)
      .eq("ticket_number", ticketNumber)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return errorResponse(404, "Ticket not found");
    }
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error, {
      context: "Admin ticket update error",
      fallbackMessage: "Unable to update ticket",
    });
  }
}
