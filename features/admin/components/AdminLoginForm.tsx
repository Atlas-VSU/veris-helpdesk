"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminLogin } from "@/features/admin/hooks/use-admin-login";

export function AdminLoginForm() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isSubmitting,
    emailRef,
    passwordRef,
    handleSubmit,
  } = useAdminLogin();

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Admin sign in"
      aria-busy={isSubmitting}
      className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-soft sm:p-8"
    >
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
