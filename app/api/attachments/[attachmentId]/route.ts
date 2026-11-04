import { NextResponse } from "next/server";
import { attachmentIdSchema } from "@/features/tickets/schemas/ticket";
import { escapeLikePattern } from "@/features/tickets/utils/ticket-list";
import { getAdminSession } from "@/lib/admin-auth";
import { errorResponse, handleApiError } from "@/lib/api-error";
import { getClientEmail } from "@/lib/client-auth";
import { normalizeEmail } from "@/lib/client-token";
import {
  getAttachmentSignedUrl,
  getSupabaseServerClient,
} from "@/lib/supabase-server";

const PRIVATE_RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  try {
    const [adminSession, clientEmail] = await Promise.all([
      getAdminSession(),
      getClientEmail(),
    ]);

    if (!adminSession && !clientEmail) {
      return errorResponse(401, "Unauthorized", {
        headers: PRIVATE_RESPONSE_HEADERS,
      });
    }

    const { attachmentId } = await context.params;
    const parsedId = attachmentIdSchema.safeParse(attachmentId);
    if (!parsedId.success) {
      return errorResponse(400, "Invalid attachment ID", {
        headers: PRIVATE_RESPONSE_HEADERS,
      });
    }

    const supabase = getSupabaseServerClient();
    const { data: attachment, error: attachmentError } = await supabase
      .from("attachments")
      .select("id, ticket_id, file_name, file_type, file_size, storage_path")
      .eq("id", parsedId.data)
      .maybeSingle();

    if (attachmentError) throw attachmentError;
    if (!attachment) {
      return errorResponse(404, "Attachment not found", {
        headers: PRIVATE_RESPONSE_HEADERS,
      });
    }

    if (!adminSession) {
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .select("id")
        .eq("id", attachment.ticket_id)
        .ilike("email", escapeLikePattern(normalizeEmail(clientEmail!)))
        .maybeSingle();

      if (ticketError) throw ticketError;
      if (!ticket) {
        return errorResponse(404, "Attachment not found", {
          headers: PRIVATE_RESPONSE_HEADERS,
        });
      }
    }

    const signedUrl = await getAttachmentSignedUrl(attachment.storage_path);

    return NextResponse.json(
      {
        data: {
          id: attachment.id,
          file_name: attachment.file_name,
          file_type: attachment.file_type,
          file_size: attachment.file_size,
          url: signedUrl,
        },
      },
      { headers: PRIVATE_RESPONSE_HEADERS },
    );
  } catch (error) {
    return handleApiError(error, {
      context: "Attachment signed URL error",
      fallbackMessage: "Unable to generate download link",
      headers: PRIVATE_RESPONSE_HEADERS,
    });
  }
}
