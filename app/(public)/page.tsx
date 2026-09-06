/*
    (public)/ — Groups all routes that are accessible to users without requiring admin authentication, without affecting the URL path.

    page.tsx — Serves as the public homepage of the helpdesk, typically providing entry points for submitting or tracking tickets.
*/

export default function PublicHomePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Veris Helpdesk</h1>
      <p className="mt-4 text-muted-foreground">
        Submit a support request or track an existing ticket.
      </p>
    </main>
  );
}
