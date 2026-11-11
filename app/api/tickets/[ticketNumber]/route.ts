import { NextResponse } from "next/server";
import { getClientTicket } from "@/features/tickets/server/get-client-ticket";
import { ticketNumberSchema } from "@/features/tickets/schemas/ticket";
import { getClientEmail } from "@/lib/client-auth";
import { errorResponse, handleApiError } from "@/lib/api-error";

const PRIVATE_RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  context: { params: Promise<{ ticketNumber: string }> },
) {
  try {
    const verifiedEmail = await getClientEmail();
    if (!verifiedEmail) {
      return errorResponse(401, "Unauthorized", {
        headers: PRIVATE_RESPONSE_HEADERS,
      });
    }

    const { ticketNumber } = await context.params;
    const result = ticketNumberSchema.safeParse(ticketNumber);
    if (!result.success) {
      return errorResponse(400, "Invalid ticket number", {
        headers: PRIVATE_RESPONSE_HEADERS,
      });
    }

    const ticket = await getClientTicket(result.data, verifiedEmail);
    if (!ticket) {
      return errorResponse(404, "Ticket not found", {
        headers: PRIVATE_RESPONSE_HEADERS,
      });
    }

    return NextResponse.json({ data: ticket }, { headers: PRIVATE_RESPONSE_HEADERS });
  } catch (error) {
    return handleApiError(error, {
      context: "Client ticket retrieval error",
      fallbackMessage: "Unable to load ticket",
      headers: PRIVATE_RESPONSE_HEADERS,
    });
  }
}
