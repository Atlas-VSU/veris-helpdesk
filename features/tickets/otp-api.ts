export type OtpErrorCode =
  | "OTP_WRONG"
  | "OTP_EXPIRED"
  | "OTP_LOCKED"
  | "OTP_RESEND_WAIT";

export type OtpApiPayload = {
  message?: unknown;
  email?: unknown;
  error?: unknown;
  code?: unknown;
  retryAfterSeconds?: unknown;
};

export function isOtpApiPayload(value: unknown): value is OtpApiPayload {
  return Boolean(value) && typeof value === "object";
}

export function getOtpErrorMessage(payload: unknown) {
  return isOtpApiPayload(payload) && typeof payload.error === "string"
    ? payload.error
    : null;
}

export function getOtpErrorCode(payload: unknown): OtpErrorCode | null {
  if (!isOtpApiPayload(payload) || typeof payload.code !== "string") return null;

  return ["OTP_WRONG", "OTP_EXPIRED", "OTP_LOCKED", "OTP_RESEND_WAIT"].includes(
    payload.code,
  )
    ? (payload.code as OtpErrorCode)
    : null;
}

export function getRetryAfterSeconds(payload: unknown) {
  if (
    !isOtpApiPayload(payload) ||
    typeof payload.retryAfterSeconds !== "number" ||
    !Number.isFinite(payload.retryAfterSeconds)
  ) {
    return null;
  }

  return Math.max(0, Math.ceil(payload.retryAfterSeconds));
}
