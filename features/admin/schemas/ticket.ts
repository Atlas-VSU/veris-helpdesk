import { z } from "zod";
import { priorityEnum } from "@/features/tickets/schemas/ticket";
import { SERVICE_OPTIONS } from "@/features/tickets/service-options";

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

export const adminTicketUpdateSchema = z.object({
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  service: z.enum(SERVICE_OPTIONS).optional(),
}).strict().refine((value) => Object.values(value).some((field) => field !== undefined), {
  message: "Provide status, priority, or service",
});
