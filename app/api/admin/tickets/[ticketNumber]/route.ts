import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { adminTicketUpdateSchema } from "@/features/admin/schemas/ticket";
import { ticketNumberSchema } from "@/features/tickets/schemas/ticket";
import { errorResponse, handleApiError, parseJsonBody } from "@/lib/api-error";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ ticketNumber: string }> },
) {
  if (!(await getAdminSession())) {
    return errorResponse(401, "Unauthorized");
  }

  const { ticketNumber } = await context.params;
  if (!ticketNumberSchema.safeParse(ticketNumber).success) {
    return errorResponse(400, "Invalid ticket number");
  }

  try {
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
