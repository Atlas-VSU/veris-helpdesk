import "server-only";

import { z } from "zod";
import { GMAIL_CREDENTIALS_MISSING, GMAIL_DELIVERY_FAILED, sendGmailEmail } from "@/lib/gmail-smtp";

const adminEmailSchema = z.email();
const ADMIN_EMAIL_MISSING = "ADMIN_NOTIFICATION_EMAIL is missing";
const ADMIN_EMAIL_INVALID = "ADMIN_NOTIFICATION_EMAIL must contain one email address";
const safeFailureReasons = [
  ADMIN_EMAIL_MISSING,
  ADMIN_EMAIL_INVALID,
  GMAIL_CREDENTIALS_MISSING,
  GMAIL_DELIVERY_FAILED,
];

export function getTicketEmailFailureReason(error: unknown): string {
  const message = error instanceof Error ? error.message : undefined;
  return safeFailureReasons.find((reason) => reason === message) ?? "Unexpected email error";
}

function getAdminNotificationEmail(): string {
  const configuredEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if (!configuredEmail) {
    throw new Error(ADMIN_EMAIL_MISSING);
  }

  const recipient = adminEmailSchema.safeParse(configuredEmail);
  if (!recipient.success) {
    throw new Error(ADMIN_EMAIL_INVALID);
  }
  return recipient.data;
}

export async function sendTicketSubmissionConfirmation(to: string, ticketNumber: string): Promise<void> {
  await sendGmailEmail(
    to,
    `Veris Helpdesk received ticket ${ticketNumber}`,
    `We received your request. Your ticket number is ${ticketNumber}. Keep this number for your records.`,
  );
}

export async function sendNewTicketAdminAlert(ticketNumber: string): Promise<void> {
  await sendGmailEmail(
    getAdminNotificationEmail(),
    `New Veris Helpdesk ticket ${ticketNumber}`,
    `A new ticket (${ticketNumber}) was submitted. Open the ticket in the admin dashboard.`,
  );
}

export async function sendAdminReplyNotice(ticketOwnerEmail: string, ticketNumber: string): Promise<void> {
  await sendGmailEmail(
    ticketOwnerEmail,
    `New reply to your Veris Helpdesk ticket ${ticketNumber}`,
    `The helpdesk replied to ticket ${ticketNumber}. Open your ticket in Veris Helpdesk to read the reply.`,
  );
}

export async function sendClientReplyAdminAlert(ticketNumber: string): Promise<void> {
  await sendGmailEmail(
    getAdminNotificationEmail(),
    `Client replied to Veris Helpdesk ticket ${ticketNumber}`,
    `The client replied to ticket ${ticketNumber}. Open the ticket in the admin dashboard to read the reply.`,
  );
}
