import { z } from "zod";

export const otpRequestSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
});

export const otpVerifySchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
  code: z
    .string({ error: "Code is required" })
    .trim()
    .regex(/^[0-9]{6}$/, "Enter the 6-digit code"),
});