// features/admin/schemas/admin.ts
import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email address"),
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;