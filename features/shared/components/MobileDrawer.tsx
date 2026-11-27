"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { navigationItems, primaryNavAction } from "../navigationItems";

export default function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isPrimaryCurrent = primaryNavAction.isCurrent(pathname);
  const PrimaryIcon = primaryNavAction.icon;

  return (
    <div className="flex items-center sm:hidden">
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger
          type="button"
          className="flex cursor-pointer items-center justify-center rounded-full p-2.5 text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-primary"
          aria-label="Toggle menu"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </DrawerTrigger>

        <DrawerContent className="[--drawer-inset:0.75rem] max-h-[85vh] rounded-[2.5rem]! border border-border bg-card px-6 pb-8 pt-2 shadow-float after:hidden">
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          <div className="space-y-6">
            <DrawerHeader className="border-b border-border p-0 pb-5 text-left">
              <DrawerTitle className="flex w-full items-start justify-start gap-3.5">
                <Avatar className="h-10 w-10 shrink-0 after:hidden">
                  <AvatarImage src="/veris-icon.png" alt="VERIS logo" />
                  <AvatarFallback className="bg-primary font-serif text-sm font-bold text-primary-foreground">
                    V
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start gap-1.5">
                  <span className="font-serif text-base font-bold leading-none text-foreground">
                    VERIS
                  </span>
                  <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-primary">
                    Helpdesk
                  </span>
                </div>
              </DrawerTitle>
            </DrawerHeader>

            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {navigationItems.map((item) => {
                const current = item.isCurrent(pathname);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3.5 overflow-hidden rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-fast active:scale-98",
                      current
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    {current && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1/4 left-0 top-1/4 w-1 rounded-r-full bg-primary"
                      />
                    )}

                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "h-4 w-4 transition-colors",
                        current
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[16rem]">
              <Link
                href={primaryNavAction.href}
                aria-current={isPrimaryCurrent ? "page" : undefined}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-fast hover:bg-primary/90 active:scale-[0.98]",
                  isPrimaryCurrent &&
                    "ring-2 ring-primary/30 ring-offset-2 ring-offset-card",
                )}
              >
                <PrimaryIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                {primaryNavAction.label}
              </Link>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
