import { NextResponse } from "next/server";
import { getClientTicket } from "@/features/tickets/server/get-client-ticket";
import { ticketNumberSchema } from "@/features/tickets/schemas/ticket";
import { getClientEmail } from "@/lib/client-auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ ticketNumber: string }> },
) {
  try {
    const verifiedEmail = await getClientEmail();
    if (!verifiedEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketNumber } = await context.params;
    const result = ticketNumberSchema.safeParse(ticketNumber);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid ticket number" },
        { status: 400 },
      );
    }

    const ticket = await getClientTicket(result.data, verifiedEmail);
    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: ticket });
  } catch (error) {
    console.error("Client ticket retrieval error:", error);
    return NextResponse.json(
      { error: "Unable to load ticket" },
      { status: 500 },
    );
  }
}
