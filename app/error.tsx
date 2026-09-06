// Defines the error boundary UI shown when an unexpected runtime error occurs within that route segment or its children.
'use client';

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-4 text-muted-foreground">
        We could not complete your request. Please try again.
      </p>
      <button
        className="mt-6 rounded-control bg-primary px-4 py-2 text-primary-foreground"
        type="button"
        onClick={() => retry()}
      >
        Try again
      </button>
    </main>
  );
}
