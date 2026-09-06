// Defines the custom 404-style page shown when a requested route or resource cannot be found.

import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-4 text-muted-foreground">
        The page you requested does not exist or may have moved.
      </p>
      <Link className="helpdesk-link mt-6 inline-block" href="/">
        Return home
      </Link>
    </main>
  );
}
