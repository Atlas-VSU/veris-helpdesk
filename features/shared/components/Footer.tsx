import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--palette-stone)] bg-[var(--palette-warm-white)]">
      <div className="mx-auto grid w-full max-w-[80rem] grid-cols-2 items-center gap-x-6 gap-y-4 px-6 py-6 sm:grid-cols-[1fr_auto_1fr] sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label="VERIS Helpdesk home"
          className="justify-self-start font-serif text-base font-medium tracking-tight text-[var(--palette-dark-olive)] transition-colors hover:text-[var(--palette-terracotta)] sm:justify-self-start"
        >
          VERIS Helpdesk
        </Link>

        <Link
          href="/privacy"
          className="justify-self-end text-sm font-medium text-[var(--palette-dark-olive)] transition-colors hover:text-[var(--palette-terracotta)] sm:col-start-2 sm:row-start-1 sm:justify-self-center"
        >
          Privacy & Policy
        </Link>

        <p className="col-span-2 justify-self-center text-center text-xs text-[var(--palette-gray-olive)] sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:justify-self-end sm:text-right">
          {"\u00A9"} {new Date().getFullYear()} VERIS Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;