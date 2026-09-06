/*
    categories/ — Contains the admin route for managing ticket categories and their relationship to available services.
    
    page.tsx under categories/ — Renders the interface for creating, editing, activating, or deactivating ticket categories.    
*/

export default function CategoriesPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Ticket categories</h1>
      <p className="mt-4 text-muted-foreground">
        Create and manage the categories available to support requests.
      </p>
    </main>
  );
}
