import "server-only";

import { z } from "zod";
import { sendGmailEmail } from "@/lib/gmail-smtp";

const adminEmailSchema = z.email();

function getAdminNotificationEmail(): string {
  const recipient = adminEmailSchema.safeParse(process.env.ADMIN_NOTIFICATION_EMAIL?.trim());
  if (!recipient.success) {
    throw new Error("ADMIN_NOTIFICATION_EMAIL must contain one email address");
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
