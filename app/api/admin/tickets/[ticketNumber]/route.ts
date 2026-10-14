import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { adminTicketUpdateSchema, ticketNumberSchema } from "@/features/admin/schemas/ticket";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ ticketNumber: string }> },
) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticketNumber } = await context.params;
  if (!ticketNumberSchema.safeParse(ticketNumber).success) {
    return NextResponse.json({ error: "Invalid ticket number" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const result = adminTicketUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid ticket update" }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseServerClient()
      .from("tickets")
      .update(result.data)
      .eq("ticket_number", ticketNumber)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Admin ticket update error:", error);
    return NextResponse.json({ error: "Unable to update ticket" }, { status: 500 });
  }
}
