import { z } from "zod";
import {
  hasAcceptedAttachmentSignature,
  validateAttachmentFile,
  validateAttachmentMetadata,
} from "@/features/submit-ticket/attachment-validation";
import { ApiError } from "@/lib/api-error";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { SavedAdminReply, ThreadAttachment } from "@/types/database";

export const ATTACHMENTS_BUCKET = "attachments";

const replyBodySchema = z
  .string()
  .trim()
  .min(1, "Reply must contain 1 to 5,000 characters after trimming.")
  .max(5000, "Reply must contain 1 to 5,000 characters after trimming.");

const existingReplyAttachmentTargetSchema = z.object({
  ticketId: z.string().uuid("Invalid ticket ID").optional(),
  messageId: z.string().uuid("Invalid message ID"),
});

const atomicReplyWithAttachmentSchema = z.object({
  ticketId: z.string().uuid("Invalid ticket ID"),
  messageId: z.string().uuid("Invalid message ID").optional(),
  adminId: z.string().uuid("Invalid admin ID").nullable().optional(),
  body: replyBodySchema,
});

export type PersistAdminReplyWithAttachmentInput = {
  ticketId: string;
  body: string;
  adminId?: string | null;
  file?: File | null;
  messageId?: string;
};

export type PersistAdminReplyAttachmentInput = {
  ticketId?: string;
  messageId?: string;
  body?: string;
  adminId?: string | null;
  file: File;
};

type AtomicReplyRpcResult = {
  id: string;
  ticket_id?: string;
  sender_type: "admin";
  body: string;
  created_at: string;
  attachments?: Array<{
    id: string;
    message_id?: string | null;
    file_name: string;
    file_type: string;
    file_size: number;
  }>;
};

export function sanitizeAttachmentFileName(fileName: string): string {
  const baseName = fileName.trim() || "attachment";
  return baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export function buildReplyAttachmentStoragePath(
  ticketId: string,
  messageId: string,
  fileName: string,
  timestamp = Date.now(),
): string {
  return `${ticketId}/${messageId}/${timestamp}_${sanitizeAttachmentFileName(fileName)}`;
}

export function extractOptionalReplyAttachment(
  formData: FormData,
  fieldName = "attachment",
): File | null {
  const entries = formData.getAll(fieldName);
  if (entries.length === 0) {
    return null;
  }

  if (entries.length > 1) {
    throw ApiError.badRequest("Only one attachment is allowed.");
  }

  const [entry] = entries;
  if (entry === null || entry === undefined || entry === "") {
    return null;
  }

  if (!(entry instanceof File)) {
    throw ApiError.badRequest("Please upload a JPG, PNG, or PDF file.");
  }

  if (entry.size === 0 && entry.name.length === 0) {
    return null;
  }

  return entry;
}

async function isReplyMessageSaved(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  messageId: string,
  ticketId: string,
): Promise<boolean> {
  const { data: replyRow, error: replyLookupError } = await supabase
    .from("messages")
    .select("id, ticket_id")
    .eq("id", messageId)
    .maybeSingle();

  if (replyLookupError) {
    console.error("Error checking whether reply message was saved before removing attachment.");
    return true;
  }

  return Boolean(replyRow && (!replyRow.ticket_id || replyRow.ticket_id === ticketId));
}

export async function persistAdminReplyWithAttachment({
  ticketId,
  body,
  adminId = null,
  file = null,
  messageId,
}: PersistAdminReplyWithAttachmentInput): Promise<SavedAdminReply> {
  const parsed = atomicReplyWithAttachmentSchema.safeParse({
    ticketId,
    messageId,
    adminId,
    body,
  });
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid reply input");
  }

  if (file !== null && file !== undefined) {
    if (!(file instanceof File)) {
      throw ApiError.badRequest("Please upload a JPG, PNG, or PDF file.");
    }

    const validationError = await validateAttachmentFile(file);
    if (validationError) {
      throw ApiError.badRequest(validationError);
    }
  }

  const supabase = getSupabaseServerClient();
  const resolvedMessageId = parsed.data.messageId ?? crypto.randomUUID();
  let storagePath: string | null = null;

  if (file) {
    storagePath = buildReplyAttachmentStoragePath(
      parsed.data.ticketId,
      resolvedMessageId,
      file.name,
    );

    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading reply attachment.");
      throw ApiError.internal("Failed to upload attachment. Please try again.", {
        cause: uploadError,
      });
    }
  }

  const { data: rawResult, error: txError } = await supabase.rpc(
    "create_admin_reply_with_attachment",
    {
      p_ticket_id: parsed.data.ticketId,
      p_body: parsed.data.body,
      p_admin_id: parsed.data.adminId ?? null,
      p_message_id: resolvedMessageId,
      p_file_name: file ? file.name : null,
      p_file_type: file ? file.type : null,
      p_file_size: file ? file.size : null,
      p_storage_path: storagePath,
    },
  );

  const result = rawResult as AtomicReplyRpcResult | null;

  if (txError || !result || (file && (!result.attachments || result.attachments.length === 0))) {
    if (storagePath) {
      console.error("Error creating reply and attachment metadata in transaction.");
      const replyWasSaved = await isReplyMessageSaved(
        supabase,
        resolvedMessageId,
        parsed.data.ticketId,
      );

      if (!replyWasSaved) {
        const { error: removeError } = await supabase.storage
          .from(ATTACHMENTS_BUCKET)
          .remove([storagePath]);
        if (removeError) {
          console.error("Error removing uploaded reply attachment after metadata failure.");
        }
      }

      throw ApiError.internal("Failed to save attachment info. Please try again.", {
        cause: txError,
      });
    }

    console.error("Error creating admin reply.");
    throw ApiError.internal("Failed to save reply. Please try again.", {
      cause: txError,
    });
  }

  return {
    id: result.id,
    sender_type: "admin",
    body: result.body,
    created_at: result.created_at,
    attachments: (result.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      message_id: attachment.message_id ?? result.id,
      file_name: attachment.file_name,
      file_type: attachment.file_type,
      file_size: attachment.file_size,
    })),
  };
}

export async function persistAdminReplyAttachment({
  ticketId,
  messageId,
  body,
  adminId = null,
  file,
}: PersistAdminReplyAttachmentInput): Promise<ThreadAttachment> {
  if (!(file instanceof File)) {
    throw ApiError.badRequest("Please upload a JPG, PNG, or PDF file.");
  }

  if (body !== undefined) {
    if (!ticketId) {
      throw ApiError.badRequest("Invalid ticket ID");
    }

    const savedReply = await persistAdminReplyWithAttachment({
      ticketId,
      messageId,
      adminId,
      body,
      file,
    });

    const savedAttachment = savedReply.attachments[0];
    if (!savedAttachment) {
      throw ApiError.internal("Failed to save attachment info. Please try again.");
    }

    return savedAttachment;
  }

  const parsedTarget = existingReplyAttachmentTargetSchema.safeParse({ ticketId, messageId });
  if (!parsedTarget.success) {
    throw ApiError.badRequest(parsedTarget.error.issues[0]?.message ?? "Invalid attachment target");
  }

  const validationError = await validateAttachmentFile(file);
  if (validationError) {
    throw ApiError.badRequest(validationError);
  }

  const supabase = getSupabaseServerClient();

  const { data: replyRow, error: replyLookupError } = await supabase
    .from("messages")
    .select("id, ticket_id")
    .eq("id", parsedTarget.data.messageId)
    .maybeSingle();

  if (replyLookupError) {
    console.error("Error verifying reply message ownership.");
    throw ApiError.internal("Failed to save attachment info. Please try again.", {
      cause: replyLookupError,
    });
  }

  if (!replyRow) {
    throw ApiError.badRequest("Reply message not found.");
  }

  if (
    parsedTarget.data.ticketId !== undefined &&
    replyRow.ticket_id !== parsedTarget.data.ticketId
  ) {
    throw ApiError.badRequest("Reply message does not belong to the specified ticket.");
  }

  const verifiedTicketId = replyRow.ticket_id;
  const storagePath = buildReplyAttachmentStoragePath(
    verifiedTicketId,
    replyRow.id,
    file.name,
  );

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Error uploading reply attachment.");
    throw ApiError.internal("Failed to upload attachment. Please try again.", {
      cause: uploadError,
    });
  }

  const { data: attachment, error: attachmentError } = await supabase
    .from("attachments")
    .insert({
      ticket_id: verifiedTicketId,
      message_id: replyRow.id,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
    })
    .select("id, message_id, file_name, file_type, file_size")
    .single();

  if (attachmentError || !attachment) {
    console.error("Error creating reply attachment record.");
    const { error: removeError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .remove([storagePath]);
    if (removeError) {
      console.error("Error removing uploaded reply attachment after metadata failure.");
    }

    throw ApiError.internal("Failed to save attachment info. Please try again.", {
      cause: attachmentError,
    });
  }

  return {
    id: attachment.id,
    message_id: attachment.message_id ?? replyRow.id,
    file_name: attachment.file_name,
    file_type: attachment.file_type,
    file_size: attachment.file_size,
  };
}

export const uploadAdminReplyAttachment = persistAdminReplyAttachment;

export {
  hasAcceptedAttachmentSignature,
  validateAttachmentFile,
  validateAttachmentMetadata,
};
