// features/tickets/schemas/ticket.ts
import { z } from "zod";

export const userTypeEnum = z.enum(["subscriber", "student"]);
export const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);

export const createTicketSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  user_type: userTypeEnum,
  service: z.string().min(1, "Service is required"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long"),
  description: z.string().min(1, "Description is required"),
  priority: priorityEnum,
  consent_given: z.boolean().refine((val) => val === true, {
    message: "You must give consent to submit a ticket",
  }),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const viewTicketSchema = z.object({
  ticket_number: z.string().min(1, "Ticket number is required"),
  email: z.string().email("Invalid email address"),
});

export type ViewTicketInput = z.infer<typeof viewTicketSchema>;