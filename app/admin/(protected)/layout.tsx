/*
    layout.tsx — Defines the shared protected admin layout, such as the sidebar, header, navigation, and authorization checks used across admin pages.
*/

import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default async function ProtectedAdminLayout({
  children,
}: LayoutProps<"/admin">) {
  if (!(await getAdminSession())) redirect("/admin/login");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
