import { z } from "zod";
import {
  hasAcceptedAttachmentSignature,
  validateAttachmentFile,
  validateAttachmentMetadata,
} from "@/features/submit-ticket/attachment-validation";
import { ApiError } from "@/lib/api-error";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { ThreadAttachment } from "@/types/database";

export const ATTACHMENTS_BUCKET = "attachments";

const replyAttachmentTargetSchema = z.object({
  ticketId: z.string().uuid("Invalid ticket ID"),
  messageId: z.string().uuid("Invalid message ID"),
});

export type PersistAdminReplyAttachmentInput = {
  ticketId: string;
  messageId: string;
  file: File;
  cleanupMessageOnError?: boolean;
  onRollback?: () => Promise<void> | void;
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
  const entry = formData.get(fieldName);
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

async function rollbackPartialReplyMessage(
  ticketId: string,
  messageId: string,
  cleanupMessageOnError: boolean,
  onRollback?: () => Promise<void> | void,
) {
  if (cleanupMessageOnError) {
    const supabase = getSupabaseServerClient();
    const { error: rollbackError } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("ticket_id", ticketId);

    if (rollbackError) {
      console.error("Error rolling back partial reply message.");
    }
  }

  if (onRollback) {
    await onRollback();
  }
}

export async function persistAdminReplyAttachment({
  ticketId,
  messageId,
  file,
  cleanupMessageOnError = true,
  onRollback,
}: PersistAdminReplyAttachmentInput): Promise<ThreadAttachment> {
  const parsedTarget = replyAttachmentTargetSchema.safeParse({ ticketId, messageId });
  if (!parsedTarget.success) {
    throw ApiError.badRequest(parsedTarget.error.issues[0]?.message ?? "Invalid attachment target");
  }

  if (!(file instanceof File)) {
    throw ApiError.badRequest("Please upload a JPG, PNG, or PDF file.");
  }

  const validationError = await validateAttachmentFile(file);
  if (validationError) {
    throw ApiError.badRequest(validationError);
  }

  const supabase = getSupabaseServerClient();
  const storagePath = buildReplyAttachmentStoragePath(
    parsedTarget.data.ticketId,
    parsedTarget.data.messageId,
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
    await rollbackPartialReplyMessage(
      parsedTarget.data.ticketId,
      parsedTarget.data.messageId,
      cleanupMessageOnError,
      onRollback,
    );
    throw ApiError.internal("Failed to upload attachment. Please try again.", {
      cause: uploadError,
    });
  }

  const { data: attachment, error: attachmentError } = await supabase
    .from("attachments")
    .insert({
      ticket_id: parsedTarget.data.ticketId,
      message_id: parsedTarget.data.messageId,
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

    await rollbackPartialReplyMessage(
      parsedTarget.data.ticketId,
      parsedTarget.data.messageId,
      cleanupMessageOnError,
      onRollback,
    );
    throw ApiError.internal("Failed to save attachment info. Please try again.", {
      cause: attachmentError,
    });
  }

  return {
    id: attachment.id,
    message_id: attachment.message_id ?? parsedTarget.data.messageId,
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
