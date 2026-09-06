/*
    dashboard/ — Contains the main admin dashboard where summary metrics, ticket counts, workloads, and recent activity can be displayed.

    page.tsx under dashboard/ — Renders the admin dashboard page.
*/

export default function AdminDashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>
      <p className="mt-4 text-muted-foreground">
        Monitor ticket activity, workload, and recent updates.
      </p>
    </main>
  );
}
