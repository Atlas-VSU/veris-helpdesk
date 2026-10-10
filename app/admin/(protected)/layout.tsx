/*
    layout.tsx — Defines the shared protected admin layout, such as the sidebar, header, navigation, and authorization checks used across admin pages.
*/

import { AdminSidebar } from "@/features/admin/components/AdminSidebar";

export default function ProtectedAdminLayout({
  children,
}: LayoutProps<"/admin">) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
