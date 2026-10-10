import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

export const OTP_EXPIRES_MINUTES = 10;
export const OTP_RESEND_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

// randomInt is cryptographically secure. Math.random is NOT safe for codes.
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export function checkOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}