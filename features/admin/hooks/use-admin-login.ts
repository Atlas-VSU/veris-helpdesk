"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAdminLoginErrorMessage } from "@/features/admin/login-api";
import { adminLoginSchema } from "@/features/admin/schemas/admin";

export function useAdminLogin() {
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

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isSubmitting,
    emailRef,
    passwordRef,
    handleSubmit,
  };
}
