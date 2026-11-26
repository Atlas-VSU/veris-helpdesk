import "server-only";

import nodemailer from "nodemailer";

export const GMAIL_CREDENTIALS_MISSING = "GMAIL_USER or GMAIL_APP_PASSWORD is missing";
export const GMAIL_DELIVERY_FAILED = "Gmail SMTP delivery failed";

export async function sendGmailEmail(to: string, subject: string, text: string): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(GMAIL_CREDENTIALS_MISSING);
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Veris Helpdesk" <${user}>`,
      to,
      subject,
      text,
    });
  } catch {
    // SMTP errors can contain recipient addresses and server responses.
    throw new Error(GMAIL_DELIVERY_FAILED);
  }
}
