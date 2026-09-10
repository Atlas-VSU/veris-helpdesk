import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="space-y-6 text-center sm:space-y-8">
      <div className="space-y-3">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-[var(--palette-terracotta)]">
          VERIS support
        </p>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--palette-moss)] sm:text-5xl">
          How can we help?
        </h1>
        <p className="mx-auto max-w-xl font-sans text-base leading-7 text-[var(--palette-dark-olive)] sm:text-lg">
          We&apos;re here to provide warm, reliable support. Whether you have a
          question, an issue, or just need guidance, our team is ready to assist
          you.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-[26rem] flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row">
        <Button
          className="h-12 w-full rounded-full bg-[var(--palette-moss)] px-6 font-sans text-sm font-bold text-[var(--palette-off-white)] shadow-[0_18px_32px_rgba(93,112,82,0.16)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[var(--palette-moss)]/90 hover:shadow-[0_24px_42px_rgba(93,112,82,0.2)] active:translate-y-0 active:scale-[0.99] sm:w-auto sm:px-8"
          nativeButton={false}
          render={<Link href="/submit-ticket" />}
        >
          Submit a ticket
        </Button>
        <Button
          className="h-12 w-full rounded-full bg-[var(--palette-terracotta)] px-6 font-sans text-sm font-bold text-[var(--palette-off-white)] shadow-[0_18px_32px_rgba(193,140,93,0.18)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[var(--palette-terracotta)]/90 hover:shadow-[0_24px_42px_rgba(193,140,93,0.24)] active:translate-y-0 active:scale-[0.99] sm:w-auto sm:px-8"
          nativeButton={false}
          render={<Link href="/tickets" />}
        >
          View my tickets
        </Button>
      </div>
    </section>
  );
}
