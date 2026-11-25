"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminLoginErrorMessage } from "@/features/admin/login-api";
import { adminLoginSchema } from "@/features/admin/schemas/admin";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);

    const parsed = adminLoginSchema.safeParse({
      email: normalizedEmail,
      password,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setError(firstIssue?.message ?? "Please enter a valid email and password.");
      if (firstIssue?.path[0] === "password") {
        passwordRef.current?.focus();
      } else {
        emailRef.current?.focus();
      }
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(getAdminLoginErrorMessage(response.status, payload));
        setIsSubmitting(false);
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach the sign-in service. Check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Admin sign in"
      aria-busy={isSubmitting}
      className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-soft sm:p-8"
    >
      <div className="mb-6 flex size-12 items-center justify-center rounded-full border border-border bg-primary/10 text-primary">
        <ShieldCheck aria-hidden="true" className="size-6" />
      </div>

      {error && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm font-medium text-destructive"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="admin-email" className="text-sm font-semibold">
            Email address
          </Label>
          <Input
            ref={emailRef}
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@veris.org"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            aria-invalid={error ? true : undefined}
            className="min-h-11 bg-card"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-password" className="text-sm font-semibold">
            Password
          </Label>
          <Input
            ref={passwordRef}
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            aria-invalid={error ? true : undefined}
            className="min-h-11 bg-card"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 min-h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {isSubmitting ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
