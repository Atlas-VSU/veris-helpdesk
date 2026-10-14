import { EmailVerificationForm } from "@/features/tickets/components/email-verification-form";

export default function VerifyPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-semibold text-[var(--palette-dark-olive)] sm:text-4xl">
          Verify your email
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Access your support tickets with a verification code sent to your email.
        </p>
      </header>
      <EmailVerificationForm />
    </main>
  );
}
