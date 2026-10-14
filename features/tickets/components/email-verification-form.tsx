"use client";

import { useRef, useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getOtpErrorCode,
  getOtpErrorMessage,
  getRetryAfterSeconds,
  isOtpApiPayload,
} from "@/features/tickets/otp-api";
import { otpRequestSchema } from "@/features/tickets/schemas/otp";

type EmailVerificationFormProps = {
  onCodeRequested: (email: string, message: string, retryAfterSeconds?: number) => void;
};

const REQUEST_SUCCESS_MESSAGE = "If this email has tickets, a code was sent.";

function getRequestError(status: number, payload: unknown) {
  if (status === 400) {
    return getOtpErrorMessage(payload) ?? "Enter a valid email address.";
  }

  if (status === 429) {
    return "Too many verification-code requests. Please wait a few minutes and try again.";
  }

  if (status >= 500) {
    return "We couldn't send a verification code right now. Please try again.";
  }

  return "We couldn't send a verification code. Please try again.";
}

export function EmailVerificationForm({ onCodeRequested }: EmailVerificationFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);
    const result = otpRequestSchema.safeParse({ email: normalizedEmail });

    if (!result.success) {
      setError(
        normalizedEmail.length === 0
          ? "Enter your email address."
          : "Enter a valid email address, such as name@example.com.",
      );
      emailRef.current?.focus();
      return;
    }

    setEmail(result.data.email);
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: result.data.email }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const retryAfterSeconds = getRetryAfterSeconds(payload);

        if (getOtpErrorCode(payload) === "OTP_RESEND_WAIT" && retryAfterSeconds !== null) {
          onCodeRequested(result.data.email, REQUEST_SUCCESS_MESSAGE, retryAfterSeconds);
          return;
        }

        setError(getRequestError(response.status, payload));
        return;
      }

      if (
        !isOtpApiPayload(payload) ||
        !("message" in payload) ||
        typeof payload.message !== "string"
      ) {
        throw new Error("Unexpected OTP request response");
      }

      onCodeRequested(result.data.email, payload.message);
    } catch {
      setError("We couldn't reach the verification service. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Email verification"
      aria-busy={isSubmitting}
      className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-soft sm:p-10"
    >
      <div className="mb-6 flex size-14 items-center justify-center rounded-full border border-border bg-[var(--palette-moss)]/10 text-primary">
        <Mail aria-hidden="true" className="size-6" />
      </div>

      <Label htmlFor="verification-email" className="text-sm font-bold">
        Email address
      </Label>
      <p id="verification-email-hint" className="mt-2 text-sm leading-6 text-muted-foreground">
        Use the email address you provided when submitting your ticket.
      </p>
      <Input
        ref={emailRef}
        id="verification-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        disabled={isSubmitting}
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError(null);
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={`verification-email-hint${error ? " verification-email-error" : ""}`}
        placeholder="name@example.com"
        className="mt-3 h-12 aria-invalid:border-destructive"
      />

      {error && (
        <p id="verification-email-error" role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 min-h-12 w-full whitespace-normal px-4 py-3"
      >
        {isSubmitting ? "Sending code..." : "Send verification code"}
      </Button>
    </form>
  );
}
