import nodemailer from "nodemailer";
import { OTP_EXPIRES_MINUTES } from "@/lib/otp";

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  // In development the code is also printed in the terminal.
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] OTP for ${to}: ${code}`);
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.error("OTP email not sent: GMAIL_USER or GMAIL_APP_PASSWORD is missing");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Veris Helpdesk" <${user}>`,
      to,
      subject: "Your Veris Helpdesk verification code",
      text: `Your verification code is ${code}. It expires in ${OTP_EXPIRES_MINUTES} minutes. If you did not ask for it, you can ignore this email.`,
    });
  } catch (err) {
    console.error("Failed to send OTP email:", err);
  }
}