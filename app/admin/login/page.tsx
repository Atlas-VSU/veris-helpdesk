/*
    login/ — Contains the admin authentication page where authorized staff sign in to access protected admin features.
    
    page.tsx under login/ — Renders the admin login screen and serves as the entry point to the admin area.
*/

export default function AdminLoginPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Admin sign in</h1>
      <p className="mt-4 text-muted-foreground">
        Sign in with an authorized administrator account.
      </p>
    </main>
  );
}
