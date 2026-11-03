import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--palette-stone)] bg-[var(--palette-warm-white)]">
      <div className="mx-auto flex w-full max-w-[80rem] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-6 sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label="VERIS Helpdesk home"
          className="font-serif text-base font-medium tracking-tight text-[var(--palette-dark-olive)] transition-colors hover:text-[var(--palette-terracotta)]"
        >
          VERIS Helpdesk
        </Link>

        <Link
          href="/privacy"
          className="transition-colors hover:text-[var(--palette-terracotta)]"
        >
          Privacy & Policy
        </Link>

        <Link href="/faq" className="transition-colors hover:text-[var(--palette-terracotta)]">
          FAQ
        </Link>

        <p className="text-center text-xs text-[var(--palette-gray-olive)] sm:text-right">
          {"\u00A9"} {new Date().getFullYear()} VERIS Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;