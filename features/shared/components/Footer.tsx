import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-[80rem] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-6 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-12">
        <Link
          href="/"
          aria-label="VERIS Helpdesk home"
          className="w-fit font-serif text-base font-medium tracking-tight text-muted-foreground transition-colors duration-fast hover:text-primary lg:justify-self-start"
        >
          VERIS Helpdesk
        </Link>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-self-center"
        >
          <Link
            href="/privacy"
            className="transition-colors duration-fast hover:text-primary"
          >
            Privacy &amp; Policy
          </Link>

          <Link
            href="/faq"
            className="transition-colors duration-fast hover:text-primary"
          >
            FAQ
          </Link>

          <Link
            href="/admin/login"
            className="transition-colors duration-fast hover:text-primary"
          >
            Admin Portal
          </Link>
        </nav>

        <p className="text-center text-xs text-muted-foreground sm:text-right lg:justify-self-end">
          {"\u00A9"} {new Date().getFullYear()} VERIS Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;