// app/admin/components/AdminSidebar.tsx
// Persistent shared sidebar for the admin layout.
// Highlights the active route using usePathname().

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TicketCheck,
  Users,
  ShieldCheck,
  Tag,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  match: (p: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/admin/dashboard",
  },
  {
    href: "/admin/tickets",
    label: "Tickets",
    icon: TicketCheck,
    match: (p) => p.startsWith("/admin/tickets"),
  },
  {
    href: "/admin/clients",
    label: "Clients",
    icon: Users,
    match: (p) => p.startsWith("/admin/clients"),
  },
  {
    href: "/admin/admins",
    label: "Administrators",
    icon: ShieldCheck,
    match: (p) => p.startsWith("/admin/admins"),
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: Tag,
    match: (p) => p.startsWith("/admin/categories"),
  },
  {
    href: "/admin/activity",
    label: "Activity Log",
    icon: History,
    match: (p) => p.startsWith("/admin/activity"),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-full w-[var(--sidebar-width)] shrink-0 border-r border-border bg-muted/40">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <Avatar className="size-9">
          <AvatarImage src="/veris-icon.png" alt="VERIS logo" />
          <AvatarFallback className="bg-primary font-serif text-sm font-bold text-primary-foreground">
            V
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-serif text-base font-bold leading-none text-foreground">
            VERIS Admin
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Management Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-fast",
                active
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}

              {/* Active indicator */}
              {active && (
                <span
                  aria-hidden="true"
                  className="ml-auto size-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings + Logout */}
      <div className="border-t border-border px-3 py-3 space-y-0.5">
        <Link
          href="/admin/settings"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground duration-fast"
        >
          <Settings aria-hidden="true" className="size-4 shrink-0" />
          Settings
        </Link>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 duration-fast"
          >
            <LogOut aria-hidden="true" className="size-4 shrink-0" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
