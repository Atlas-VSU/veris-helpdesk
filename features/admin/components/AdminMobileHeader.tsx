"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "./AdminSidebar";
import { AdminLogoutButton } from "./AdminLogoutButton";

export function AdminMobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-border bg-card px-4 md:hidden">
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8">
          <AvatarImage src="/veris-icon.png" alt="VERIS logo" />
          <AvatarFallback className="bg-primary font-serif text-xs font-bold text-primary-foreground">
            V
          </AvatarFallback>
        </Avatar>
        <span className="font-serif text-sm font-bold text-foreground">
          VERIS Admin
        </span>
      </div>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger
          type="button"
          aria-label="Open admin menu"
          className="flex cursor-pointer items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Menu aria-hidden="true" className="size-5" />
        </DrawerTrigger>

        <DrawerContent className="max-h-[85vh] rounded-t-[1.75rem] border border-border bg-card px-6 pb-8 pt-3 shadow-float">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          <DrawerHeader className="border-b border-border p-0 pb-4 text-left">
            <DrawerTitle className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src="/veris-icon.png" alt="VERIS logo" />
                <AvatarFallback className="bg-primary font-serif text-sm font-bold text-primary-foreground">
                  V
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-serif text-base font-bold text-foreground">
                  VERIS Admin
                </span>
                <span className="text-xs text-muted-foreground">
                  Management Portal
                </span>
              </div>
            </DrawerTitle>
          </DrawerHeader>

          <nav aria-label="Admin mobile navigation" className="mt-4 flex flex-col gap-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-border pt-4">
            <AdminLogoutButton onLogoutSuccess={() => setIsOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
}
