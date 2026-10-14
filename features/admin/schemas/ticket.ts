import { z } from "zod";
import { priorityEnum } from "@/features/tickets/schemas/ticket";

const statusEnum = z.enum([
  "new", "open", "in_progress", "waiting_for_client", "resolved", "closed",
]);
const positiveInteger = z.string().regex(/^[0-9]+$/)
  .transform(Number).pipe(z.number().int().min(1).max(Number.MAX_SAFE_INTEGER));

export const adminTicketsQuerySchema = z.object({
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  q: z.string().optional(),
  page: positiveInteger.default(1),
  pageSize: positiveInteger.pipe(z.number().max(50)).default(10),
}).refine(({ page, pageSize }) => Number.isSafeInteger(page * pageSize), {
  message: "Page is out of range",
});

export const ticketNumberSchema = z.string().regex(/^TCK-[0-9]{4}-[0-9]{5}$/);

export const adminTicketUpdateSchema = z.object({
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
}).strict().refine((value) => value.status !== undefined || value.priority !== undefined, {
  message: "Provide status or priority",
});
