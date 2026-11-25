/*
    login/ — Contains the admin authentication page where authorized staff sign in to access protected admin features.
    
    page.tsx under login/ — Renders the admin login screen and serves as the entry point to the admin area.
*/

import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/features/admin/components/AdminLoginForm";
import { getAdminSession } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  if (await getAdminSession()) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            VERIS Admin
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sign in with an authorized administrator account.
          </p>
        </header>

        <AdminLoginForm />
      </div>
    </main>
  );
}
