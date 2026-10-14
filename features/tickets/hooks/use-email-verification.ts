"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const OTP_RESEND_SECONDS = 60;

type OtpRequestPayload = {
  message?: unknown;
  error?: unknown;
  code?: unknown;
  retryAfterSeconds?: unknown;
};

function isOtpRequestPayload(value: unknown): value is OtpRequestPayload {
  return Boolean(value) && typeof value === "object";
}

export function useEmailVerification(email: string | null) {
  const [countdownEndsAt, setCountdownEndsAt] = useState<number | null>(null);
  const [secondsUntilResend, setSecondsUntilResend] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  const startResendCountdown = useCallback((seconds = OTP_RESEND_SECONDS) => {
    const normalizedSeconds = Math.max(0, Math.ceil(seconds));
    setResendError(null);
    setResendMessage(null);
    setSecondsUntilResend(normalizedSeconds);
    setCountdownEndsAt(
      normalizedSeconds > 0 ? Date.now() + normalizedSeconds * 1000 : null,
    );
  }, []);

  useEffect(() => {
    if (countdownEndsAt === null) return;
    const endTime = countdownEndsAt;

    function updateCountdown() {
      const secondsRemaining = Math.max(
        0,
        Math.ceil((endTime - Date.now()) / 1000),
      );

      setSecondsUntilResend(secondsRemaining);

      if (secondsRemaining === 0) {
        setCountdownEndsAt(null);
      }
    }

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [countdownEndsAt]);

  const resendCode = useCallback(async () => {
    if (!email || secondsUntilResend > 0 || requestInFlight.current) return false;

    requestInFlight.current = true;
    setIsResending(true);
    setResendError(null);
    setResendMessage(null);

    try {
      const response = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        if (
          isOtpRequestPayload(payload) &&
          payload.code === "OTP_RESEND_WAIT" &&
          typeof payload.retryAfterSeconds === "number" &&
          Number.isFinite(payload.retryAfterSeconds)
        ) {
          startResendCountdown(payload.retryAfterSeconds);
        }

        setResendError(
          isOtpRequestPayload(payload) && typeof payload.error === "string"
            ? payload.error
            : "We couldn't resend the verification code. Please try again.",
        );
        return false;
      }

      if (!isOtpRequestPayload(payload) || typeof payload.message !== "string") {
        throw new Error("Unexpected OTP request response");
      }

      startResendCountdown();
      setResendMessage(payload.message);
      return true;
    } catch {
      setResendError(
        "We couldn't resend the verification code. Check your connection and try again.",
      );
      return false;
    } finally {
      requestInFlight.current = false;
      setIsResending(false);
    }
  }, [email, secondsUntilResend, startResendCountdown]);

  return {
    secondsUntilResend,
    isResending,
    resendError,
    resendMessage,
    resendCode,
    startResendCountdown,
  };
}
