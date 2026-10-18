import { z } from "zod";

const ticketStatusSchema = z.enum([
  "new",
  "open",
  "in_progress",
  "waiting_for_client",
  "resolved",
  "closed",
]);

const ticketPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
const ticketUserTypeSchema = z.enum(["subscriber", "student"]);

const ticketMessageSchema = z.object({
  sender_type: z.enum(["client", "admin"]),
  body: z.string(),
  created_at: z.string().datetime({ offset: true }),
});

const ticketAttachmentSchema = z.object({
  file_name: z.string(),
  file_type: z.string(),
  file_size: z.number().int().nonnegative(),
});

export const clientTicketDetailSchema = z.object({
  id: z.string().uuid(),
  ticket_number: z.string().regex(/^TCK-[0-9]{4}-[0-9]{5}$/),
  full_name: z.string(),
  email: z.string().email(),
  user_type: ticketUserTypeSchema,
  service: z.string(),
  subject: z.string(),
  description: z.string(),
  priority: ticketPrioritySchema,
  status: ticketStatusSchema,
  consent_given: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  messages: z.array(ticketMessageSchema),
  attachments: z.array(ticketAttachmentSchema),
});

export const clientTicketDetailResponseSchema = z.object({
  data: clientTicketDetailSchema,
});

export type ClientTicketDetail = z.infer<typeof clientTicketDetailSchema>;
export type ClientTicketMessage = z.infer<typeof ticketMessageSchema>;
export type ClientTicketAttachment = z.infer<typeof ticketAttachmentSchema>;
export type ClientTicketStatus = z.infer<typeof ticketStatusSchema>;
export type ClientTicketPriority = z.infer<typeof ticketPrioritySchema>;
