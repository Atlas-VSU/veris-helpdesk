import { z } from "zod";

export const notificationIdSchema = z.string().uuid("Invalid notification ID");

export const notificationReadInputSchema = z
  .object({
    is_read: z.literal(true, {
      error: "is_read must be true",
    }),
  })
  .strict();

export type NotificationReadInput = z.infer<typeof notificationReadInputSchema>;
