"use client";

import { useRef, useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getOtpErrorCode,
  getOtpErrorMessage,
  isOtpApiPayload,
} from "@/features/tickets/otp-api";
import { otpVerifySchema } from "@/features/tickets/schemas/otp";

type VerificationErrorKind =
  | "invalid-input"
  | "wrong"
  | "expired"
  | "locked"
  | "rate-limit"
  | "server"
  | "fallback";

type VerificationError = {
  kind: VerificationErrorKind;
  message: string;
};

function getVerificationError(status: number, payload: unknown): VerificationError {
  const errorCode = getOtpErrorCode(payload);

  if (status === 400) {
    return {
      kind: "invalid-input",
      message: getOtpErrorMessage(payload) ?? "Enter a valid 6-digit code.",
    };
  }

  if (errorCode === "OTP_WRONG") {
    return {
      kind: "wrong",
      message: "That code is not correct. Check the email and try again.",
    };
  }

  if (errorCode === "OTP_EXPIRED") {
    return {
      kind: "expired",
      message: "That code has expired. Request a new code to continue.",
    };
  }

  if (errorCode === "OTP_LOCKED") {
    return {
      kind: "locked",
      message: "All five attempts have been used. Request a new code to continue.",
    };
  }

  if (status === 429) {
    return {
      kind: "rate-limit",
      message: "Too many verification attempts. Please wait a few minutes and try again.",
    };
  }

  if (status >= 500) {
    return {
      kind: "server",
      message: "We couldn't verify the code right now. Please try again.",
    };
  }

  return {
    kind: "fallback",
    message: "We couldn't verify that code. Please try again.",
  };
}

type OtpVerificationFormProps = {
  email: string;
  requestMessage: string;
  secondsUntilResend: number;
  isResending: boolean;
  resendError: string | null;
  onResend: () => Promise<boolean>;
  onChangeEmail: () => void;
};

export function OtpVerificationForm({
  email,
  requestMessage,
  secondsUntilResend,
  isResending,
  resendError,
  onResend,
  onChangeEmail,
}: OtpVerificationFormProps) {
  const router = useRouter();
  const codeRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [verificationError, setVerificationError] = useState<VerificationError | null>(null);
  const [requiresNewCode, setRequiresNewCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResend() {
    setVerificationError(null);
    const wasSent = await onResend();

    if (wasSent) {
      setCode("");
      setRequiresNewCode(false);
      window.requestAnimationFrame(() => codeRef.current?.focus());
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const result = otpVerifySchema.safeParse({ email, code });

    if (!result.success) {
      setVerificationError({
        kind: "invalid-input",
        message: "Enter the complete 6-digit code.",
      });
      codeRef.current?.focus();
      return;
    }

    setCode(result.data.code);
    setVerificationError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(result.data),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const nextError = getVerificationError(response.status, payload);

        setVerificationError(nextError);

        if (nextError.kind === "expired" || nextError.kind === "locked") {
          setCode("");
          setRequiresNewCode(true);
        } else if (nextError.kind === "wrong" || nextError.kind === "invalid-input") {
          window.requestAnimationFrame(() => codeRef.current?.focus());
        }
        return;
      }

      if (
        !isOtpApiPayload(payload) ||
        !("message" in payload) ||
        payload.message !== "Verified" ||
        !("email" in payload) ||
        payload.email !== result.data.email
      ) {
        throw new Error("Unexpected OTP verification response");
      }

      router.replace("/tickets");
      router.refresh();
    } catch {
      setVerificationError({
        kind: "fallback",
        message: "We couldn't reach the verification service. Check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isBusy = isSubmitting || isResending;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Code verification"
      aria-busy={isBusy}
      className="min-w-0 rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-soft sm:p-10"
    >
      <div className="mb-6 flex size-14 items-center justify-center rounded-full border border-border bg-[var(--palette-moss)]/10 text-primary">
        <KeyRound aria-hidden="true" className="size-6" />
      </div>

      <h2 className="font-serif text-2xl font-semibold text-[var(--palette-dark-olive)]">
        Enter verification code
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        If tickets are associated with{" "}
        <span className="break-all font-semibold text-foreground">{email}</span>, a six-digit code
        has been sent.
      </p>

      <div className="mt-6">
        <Label htmlFor="verification-code" className="text-sm font-bold">
          Verification code
        </Label>
        <p id="verification-code-hint" className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter the six digits from the email. The code expires after 10 minutes.
        </p>
        <Input
          autoFocus
          ref={codeRef}
          id="verification-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          disabled={isBusy || requiresNewCode}
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
            if (
              verificationError?.kind === "wrong" ||
              verificationError?.kind === "invalid-input"
            ) {
              setVerificationError(null);
            }
          }}
          aria-invalid={Boolean(verificationError)}
          aria-describedby={`verification-code-hint verification-code-status${verificationError ? " verification-code-error" : ""}`}
          placeholder="000000"
          className="mt-3 h-14 text-center font-mono text-2xl tracking-[0.5em] tabular-nums aria-invalid:border-destructive"
        />
      </div>

      {verificationError && (
        <p id="verification-code-error" role="alert" className="mt-2 text-sm text-destructive">
          {verificationError.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={isBusy || requiresNewCode}
        className="mt-6 min-h-12 w-full whitespace-normal px-4 py-3"
      >
        {isSubmitting
          ? "Verifying…"
          : requiresNewCode
            ? "Request a new code to continue"
            : "Verify code"}
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting || isResending || secondsUntilResend > 0}
        onClick={handleResend}
        aria-describedby={resendError ? "verification-resend-error" : undefined}
        className="mt-3 min-h-11 w-full whitespace-normal px-4 py-2"
      >
        {isResending
          ? "Resending…"
          : secondsUntilResend > 0
            ? `Resend code in ${secondsUntilResend}s`
            : "Resend code"}
      </Button>

      {resendError && (
        <p id="verification-resend-error" role="alert" className="mt-2 text-sm text-destructive">
          {resendError}
        </p>
      )}

      <Button
        type="button"
        variant="link"
        disabled={isSubmitting || isResending}
        onClick={onChangeEmail}
        className="mt-1 min-h-11 w-full whitespace-normal px-4 py-2"
      >
        Use a different email
      </Button>

      <p
        id="verification-code-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-4 text-sm leading-6 text-muted-foreground"
      >
        {isSubmitting ? "Verifying…" : isResending ? "Resending…" : requestMessage}
      </p>
    </form>
  );
}
