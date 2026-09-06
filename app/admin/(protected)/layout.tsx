/*
    layout.tsx — Defines the shared protected admin layout, such as the sidebar, header, navigation, and authorization checks used across admin pages.
*/

export default function ProtectedAdminLayout({
  children,
}: LayoutProps<"/admin">) {
  return <div className="min-h-full bg-background">{children}</div>;
}
