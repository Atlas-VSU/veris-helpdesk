import { z } from "zod";

export const replyBodyError = "Reply must contain 1 to 5,000 characters after trimming.";
export const replyBodySchema = z.string().trim().regex(/^\S(?:[\s\S]{0,4998}\S)?$/u, replyBodyError);
export const clientReplyInputSchema = z.strictObject({ body: replyBodySchema });
