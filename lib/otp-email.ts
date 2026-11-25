import { sendGmailEmail } from "@/lib/gmail-smtp";
import { OTP_EXPIRES_MINUTES } from "@/lib/otp";

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  // In development the code is also printed in the terminal.
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] OTP for ${to}: ${code}`);
  }

  try {
    await sendGmailEmail(
      to,
      "Your Veris Helpdesk verification code",
      `Your verification code is ${code}. It expires in ${OTP_EXPIRES_MINUTES} minutes. If you did not ask for it, you can ignore this email.`,
    );
  } catch (error) {
    console.error("OTP email not sent:", error instanceof Error ? error.message : "Gmail SMTP delivery failed");
  }
}
