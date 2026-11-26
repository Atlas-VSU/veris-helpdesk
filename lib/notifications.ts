import { z } from "zod";
import { ticketNumberSchema } from "@/features/tickets/schemas/ticket";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { AdminNotification, NotificationEventType } from "@/types/database";

export const ADMIN_NOTIFICATIONS_LIMIT = 50;

const NOTIFICATION_SELECT = "id, message, is_read, created_at, tickets(ticket_number)";

const recordNotificationEventSchema = z.object({
  type: z.enum(["new_ticket", "client_reply"]),
  ticketId: z.string().uuid("Invalid ticket ID"),
  ticketNumber: ticketNumberSchema,
});

export type RecordNotificationEventInput = z.infer<typeof recordNotificationEventSchema>;

export type TicketNotificationTarget = {
  ticketId: string;
  ticketNumber: string;
};

type NotificationQueryRow = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  ticket_number?: string | null;
  tickets?: { ticket_number?: string | null } | Array<{ ticket_number?: string | null }> | null;
};

export function formatNotificationMessage(
  type: NotificationEventType,
  ticketNumber: string,
): string {
  const parsedTicketNumber = ticketNumberSchema.parse(ticketNumber);
  if (type === "new_ticket") {
    return `New ticket ${parsedTicketNumber} submitted.`;
  }
  return `Client replied to ${parsedTicketNumber}.`;
}

export function mapNotificationRow(
  row: NotificationQueryRow,
  fallbackTicketNumber: string | null = null,
): AdminNotification {
  const relatedTicket = Array.isArray(row.tickets) ? row.tickets[0] : row.tickets;
  const ticketNumber =
    typeof row.ticket_number === "string"
      ? row.ticket_number
      : typeof relatedTicket?.ticket_number === "string"
        ? relatedTicket.ticket_number
        : fallbackTicketNumber;

  return {
    id: row.id,
    message: row.message,
    is_read: Boolean(row.is_read),
    created_at: row.created_at,
    ticket_number: ticketNumber ?? null,
  };
}

export async function recordNotificationEvent(
  input: RecordNotificationEventInput,
): Promise<AdminNotification> {
  const parsed = recordNotificationEventSchema.parse(input);
  const message = formatNotificationMessage(parsed.type, parsed.ticketNumber);

  const { data, error } = await getSupabaseServerClient()
    .from("notifications")
    .insert({
      ticket_id: parsed.ticketId,
      message,
      is_read: false,
    })
    .select(NOTIFICATION_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapNotificationRow(data as NotificationQueryRow, parsed.ticketNumber);
}

function normalizeTicketTarget(
  targetOrTicketId: TicketNotificationTarget | string,
  ticketNumberArg?: string,
): TicketNotificationTarget {
  if (typeof targetOrTicketId === "string") {
    return {
      ticketId: targetOrTicketId,
      ticketNumber: ticketNumberArg ?? "",
    };
  }
  return targetOrTicketId;
}

export async function recordNewTicketNotification(
  targetOrTicketId: TicketNotificationTarget | string,
  ticketNumberArg?: string,
): Promise<AdminNotification> {
  const { ticketId, ticketNumber } = normalizeTicketTarget(targetOrTicketId, ticketNumberArg);
  return recordNotificationEvent({
    type: "new_ticket",
    ticketId,
    ticketNumber,
  });
}

export async function recordClientReplyNotification(
  targetOrTicketId: TicketNotificationTarget | string,
  ticketNumberArg?: string,
): Promise<AdminNotification> {
  const { ticketId, ticketNumber } = normalizeTicketTarget(targetOrTicketId, ticketNumberArg);
  return recordNotificationEvent({
    type: "client_reply",
    ticketId,
    ticketNumber,
  });
}

export async function listAdminNotifications(): Promise<AdminNotification[]> {
  const { data, error } = await getSupabaseServerClient()
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(ADMIN_NOTIFICATIONS_LIMIT);

  if (error) {
    throw error;
  }

  return ((data ?? []) as NotificationQueryRow[]).map((row) => mapNotificationRow(row));
}

export async function markAdminNotificationRead(
  notificationId: string,
): Promise<AdminNotification | null> {
  const { data, error } = await getSupabaseServerClient()
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .select(NOTIFICATION_SELECT)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapNotificationRow(data as NotificationQueryRow);
}

export async function deleteAdminNotification(notificationId: string): Promise<boolean> {
  const { data, error } = await getSupabaseServerClient()
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}
