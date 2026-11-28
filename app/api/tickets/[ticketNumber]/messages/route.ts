import { after, NextResponse } from "next/server";
import { clientReplyInputSchema, replyBodyError } from "@/features/tickets/schemas/reply";
import { ticketNumberSchema } from "@/features/tickets/schemas/ticket";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/api-error";
import { getClientEmail } from "@/lib/client-auth";
import { recordClientReplyNotification } from "@/lib/notifications";
import { checkAuthRateLimit, clientReplyRateLimit } from "@/lib/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getTicketEmailFailureReason, sendClientReplyAdminAlert } from "@/lib/ticket-email";

export async function POST(request: Request, context: { params: Promise<{ ticketNumber: string }> }) {
  try {
    const email = await getClientEmail();
    if (!email) throw ApiError.unauthorized();
    const { ticketNumber } = await context.params;
    ticketNumberSchema.parse(ticketNumber);
    const quota = await checkAuthRateLimit(clientReplyRateLimit, email);
    if (quota && !quota.success) throw ApiError.tooManyRequests();

    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      throw ApiError.badRequest("Expected a JSON reply.");
    }
    const input = clientReplyInputSchema.safeParse(await parseJsonBody(request));
    if (!input.success) {
      const extraFields = input.error.issues.some((issue) => issue.code === "unrecognized_keys");
      throw ApiError.badRequest(extraFields ? "Unexpected reply field." : replyBodyError);
    }

    const { data, error } = await getSupabaseServerClient()
      .rpc("create_client_ticket_reply", {
        p_ticket_number: ticketNumber,
        p_email: email,
        p_body: input.data.body,
      })
      .maybeSingle();
    if (error?.code === "VR400") throw ApiError.badRequest("Ticket is closed.");
    if (error) throw error;
    if (!data) throw ApiError.notFound("Ticket not found");

    try {
      await recordClientReplyNotification({ ticketId: data.ticket_id, ticketNumber });
    } catch {
      console.error("Failed to record client reply notification.");
    }
    after(async () => {
      try {
        await sendClientReplyAdminAlert(ticketNumber);
      } catch (error) {
        console.error("Failed to send client reply alert.", getTicketEmailFailureReason(error));
      }
    });
    const reply = {
      id: data.id,
      sender_type: "client",
      body: data.body,
      created_at: data.created_at,
      attachments: [],
    };
    return NextResponse.json({ data: reply }, { status: 201 });
  } catch (error) {
    return handleApiError(error, { context: "Client ticket reply", fallbackMessage: "Unable to save reply" });
  }
}
