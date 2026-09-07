import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="space-y-8 text-center">
      <div className="space-y-3">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-[var(--palette-terracotta)]">
          VERIS support
        </p>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--palette-moss)] sm:text-5xl">
          How can we help?
        </h1>
        <p className="mx-auto max-w-xl font-sans text-lg leading-7 text-[var(--palette-dark-olive)]">
          We&apos;re here to provide warm, reliable support. Whether you have a
          question, an issue, or just need guidance, our team is ready to assist
          you.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button
          className="h-12 w-full rounded-full bg-[var(--palette-moss)] px-8 font-sans text-sm font-bold text-white shadow-[0_20px_40px_rgba(93,112,82,0.08)] hover:bg-[var(--palette-charcoal-olive)] sm:w-auto"
          render={<Link href="/submit-ticket" />}
        >
          Submit a ticket
        </Button>
        <Button
          className="h-12 w-full rounded-full bg-[var(--palette-terracotta)] px-8 font-sans text-sm font-bold text-white shadow-[0_20px_40px_rgba(193,140,93,0.1)] hover:bg-[var(--palette-charcoal-olive)] sm:w-auto"
          render={<Link href="/tickets" />}
        >
          View my tickets
        </Button>
      </div>

      <Link
        className="inline-block font-sans text-xs font-bold text-[var(--palette-dark-olive)] underline decoration-[var(--palette-stone)] underline-offset-4 transition-colors hover:text-[var(--palette-moss)]"
        href="/admin/login"
      >
        Admin login
      </Link>
    </section>
  );
}
