import { after, NextResponse } from "next/server";
import { replyBodySchema, replyBodyError } from "@/features/tickets/schemas/reply";
import { ticketNumberSchema } from "@/features/tickets/schemas/ticket";
import { getAdminSession } from "@/lib/admin-auth";
import { ApiError, handleApiError } from "@/lib/api-error";
import { extractOptionalReplyAttachment, persistAdminReplyWithAttachment } from "@/lib/reply-attachments";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getTicketEmailFailureReason, sendAdminReplyNotice } from "@/lib/ticket-email";

async function parseAdminReply(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "multipart/form-data") {
    throw ApiError.badRequest("Expected a multipart reply.");
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw ApiError.badRequest("Invalid multipart reply.");
  }
  for (const key of form.keys()) {
    if (key !== "body" && key !== "attachment") throw ApiError.badRequest("Unexpected reply field.");
  }
  const bodies = form.getAll("body");
  const body = replyBodySchema.safeParse(bodies[0]);
  if (bodies.length !== 1 || !body.success) throw ApiError.badRequest(replyBodyError);
  if (typeof form.get("attachment") === "string") {
    throw ApiError.badRequest("Please upload a JPG, PNG, or PDF file.");
  }
  return { body: body.data, file: extractOptionalReplyAttachment(form) };
}

export async function POST(request: Request, context: { params: Promise<{ ticketNumber: string }> }) {
  try {
    const admin = await getAdminSession();
    if (!admin) throw ApiError.unauthorized();
    const { ticketNumber } = await context.params;
    ticketNumberSchema.parse(ticketNumber);
    const input = await parseAdminReply(request);
    const { data: ticket, error } = await getSupabaseServerClient()
      .from("tickets")
      .select("id,email,status")
      .eq("ticket_number", ticketNumber)
      .maybeSingle();
    if (error) throw error;
    if (!ticket) throw ApiError.notFound("Ticket not found");
    if (ticket.status === "closed") throw ApiError.badRequest("Ticket is closed.");

    const data = await persistAdminReplyWithAttachment({ ...input, ticketId: ticket.id, adminId: admin.adminId });
    after(async () => {
      try {
        await sendAdminReplyNotice(ticket.email, ticketNumber);
      } catch (error) {
        console.error("Failed to send admin reply notice.", getTicketEmailFailureReason(error));
      }
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error, { context: "Admin ticket reply", fallbackMessage: "Unable to save reply" });
  }
}
