import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/60">
      <div className="mx-auto grid w-full max-w-[80rem] grid-cols-2 items-center gap-x-6 gap-y-4 px-6 py-6 sm:grid-cols-[1fr_auto_1fr] sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label="VERIS Helpdesk home"
          className="justify-self-start font-serif text-base font-bold tracking-tight text-[#78786C] transition-colors hover:text-secondary"
        >
          VERIS Helpdesk
        </Link>

        <Link
          href="/privacy"
          className="justify-self-end text-sm font-medium text-[#78786C] transition-colors hover:text-secondary sm:col-start-2 sm:row-start-1 sm:justify-self-center"
        >
          Privacy & Policy
        </Link>

        <p className="col-span-2 justify-self-center text-center text-xs text-muted-foreground sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:justify-self-end sm:text-right">
          {"\u00A9"} {new Date().getFullYear()} VERIS Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
