/*
    admins/ — Contains the administrative route for managing authorized helpdesk administrators.
    
    page.tsx under admins/ — Renders the admin-management interface for viewing and managing administrator accounts.
*/

export default function AdminsPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Administrators</h1>
      <p className="mt-4 text-muted-foreground">
        View and manage helpdesk administrator accounts.
      </p>
    </main>
  );
}

