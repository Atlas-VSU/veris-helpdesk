"use client";

import { useRef, useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { otpRequestSchema } from "@/features/tickets/schemas/otp";

export function EmailVerificationForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailValidated, setEmailValidated] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailValidated(false);

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
    setEmailValidated(true);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Email verification"
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
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError(null);
          setEmailValidated(false);
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

      <Button type="submit" className="mt-6 min-h-12 w-full whitespace-normal px-4 py-3">
        Send verification code
      </Button>

      <p role="status" className="mt-4 text-sm leading-6 text-muted-foreground">
        {emailValidated
          ? "Your email address is valid. Code delivery is not available yet; no code has been sent."
          : "Code delivery will be available soon. You can check your email address here."}
      </p>
    </form>
  );
}
