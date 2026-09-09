import { NextResponse } from "next/server";
import { createTicketSchema } from "@/features/tickets/schemas/ticket";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createTicketSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid ticket data" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("tickets")
      .insert(result.data)
      .select("ticket_number")
      .single<{ ticket_number: string }>();

    if (error) {
      console.error("Ticket creation error:", error);
      return NextResponse.json({ error: "Unable to submit ticket" }, { status: 500 });
    }

    return NextResponse.json({ ticketNumber: data.ticket_number }, { status: 201 });
  } catch (error) {
    console.error("Ticket submission error:", error);
    return NextResponse.json({ error: "Unable to submit ticket" }, { status: 500 });
  }
}