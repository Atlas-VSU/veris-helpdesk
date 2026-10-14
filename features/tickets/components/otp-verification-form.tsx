"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { otpVerifySchema } from "@/features/tickets/schemas/otp";

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
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResend() {
    const wasSent = await onResend();

    if (wasSent) {
      setCode("");
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const result = otpVerifySchema.safeParse({ email, code });

    if (!result.success) {
      setError("Enter the complete 6-digit code.");
      return;
    }

    setCode(result.data.code);
    setError(null);
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
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "We couldn't verify that code. Please try again.";

        setError(message);
        return;
      }

      if (
        !payload ||
        typeof payload !== "object" ||
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
      setError("We couldn't verify that code. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Code verification"
      aria-busy={isSubmitting}
      className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-soft sm:p-10"
    >
      <div className="mb-6 flex size-14 items-center justify-center rounded-full border border-border bg-[var(--palette-moss)]/10 text-primary">
        <KeyRound aria-hidden="true" className="size-6" />
      </div>

      <h2 className="font-serif text-2xl font-semibold text-[var(--palette-dark-olive)]">
        Enter verification code
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        If tickets are associated with <span className="font-semibold text-foreground">{email}</span>,
        a six-digit code has been sent.
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
          id="verification-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          disabled={isSubmitting}
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
            setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={`verification-code-hint verification-code-status${error ? " verification-code-error" : ""}`}
          placeholder="000000"
          className="mt-3 h-14 text-center font-mono text-2xl tracking-[0.5em] tabular-nums aria-invalid:border-destructive"
        />
      </div>

      {error && (
        <p id="verification-code-error" role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 min-h-12 w-full whitespace-normal px-4 py-3"
      >
        {isSubmitting ? "Verifying..." : "Verify code"}
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting || isResending || secondsUntilResend > 0}
        onClick={handleResend}
        className="mt-3 min-h-10 w-full whitespace-normal px-4 py-2"
      >
        {isResending
          ? "Resending code..."
          : secondsUntilResend > 0
            ? `Resend code in ${secondsUntilResend}s`
            : "Resend code"}
      </Button>

      {resendError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {resendError}
        </p>
      )}

      <Button
        type="button"
        variant="link"
        disabled={isSubmitting || isResending}
        onClick={onChangeEmail}
        className="mt-1 h-auto w-full whitespace-normal py-2"
      >
        Use a different email
      </Button>

      <p
        id="verification-code-status"
        role="status"
        className="mt-4 text-sm leading-6 text-muted-foreground"
      >
        {requestMessage}
      </p>
    </form>
  );
}
