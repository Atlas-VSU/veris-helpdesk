"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getOtpErrorCode,
  getOtpErrorMessage,
  getRetryAfterSeconds,
  isOtpApiPayload,
} from "@/features/tickets/otp-api";

const OTP_RESEND_SECONDS = 60;

function getResendError(status: number, payload: unknown) {
  if (status === 400) {
    return getOtpErrorMessage(payload) ?? "The resend request was invalid. Please try again.";
  }

  if (status === 429) {
    return "Too many verification-code requests. Please wait a few minutes and try again.";
  }

  if (status >= 500) {
    return "We couldn't send a new code right now. Please try again.";
  }

  return "We couldn't resend the verification code. Please try again.";
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
        const retryAfterSeconds = getRetryAfterSeconds(payload);

        if (getOtpErrorCode(payload) === "OTP_RESEND_WAIT" && retryAfterSeconds !== null) {
          startResendCountdown(retryAfterSeconds);
          setResendError(
            `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
          );
          return false;
        }

        setResendError(getResendError(response.status, payload));
        return false;
      }

      if (!isOtpApiPayload(payload) || typeof payload.message !== "string") {
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
