import type { Tables } from "@/types/supabase";

export type TicketDetailMessage = Pick<
  Tables<"messages">,
  "id" | "sender_type" | "body" | "created_at"
>;

export type TicketDetailAttachment = Pick<
  Tables<"attachments">,
  "id" | "message_id" | "file_name" | "file_type" | "file_size"
>;

export type ClientTicketDetail = Tables<"tickets"> & {
  messages: TicketDetailMessage[];
  attachments: TicketDetailAttachment[];
};
