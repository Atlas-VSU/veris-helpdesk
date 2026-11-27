"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { navigationItems } from "../navigationItems";

export default function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  return(
    <div className="flex items-center sm:hidden">
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger
              type="button"
              className="flex cursor-pointer items-center justify-center rounded-full p-2.5 text-[var(--palette-dark-olive)] transition-colors hover:bg-[var(--palette-sand)] hover:text-[var(--palette-moss)]"
              aria-label="Toggle menu"
            >
              <Menu aria-hidden="true" className="w-5 h-5" />
            </DrawerTrigger>

            <DrawerContent className="[--drawer-inset:0.75rem] max-h-[85vh] rounded-[2.5rem]! border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] px-6 pb-8 pt-2 shadow-float after:hidden">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-5" />
                <div className="space-y-6">
                <DrawerHeader className="text-left border-b border-border pb-5 p-0">
                  <DrawerTitle className="flex items-start justify-start gap-3.5 w-full">
                    <Avatar className="w-10 h-10 shrink-0 after:hidden">
                      <AvatarImage src="/veris-icon.png" alt="VERIS logo" />
                      <AvatarFallback className="bg-[var(--palette-moss)] text-[var(--palette-off-white)] text-sm font-bold font-serif">
                        V
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="text-base font-bold leading-none text-[var(--palette-charcoal-olive)] font-serif">
                        VERIS
                      </span>
                      <span className="w-fit rounded-full bg-[var(--palette-moss)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--palette-moss)] leading-none">
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
                          "group relative flex items-center gap-3.5 overflow-hidden rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-98",
                          item.primary
                            ? "mt-1 bg-primary text-primary-foreground hover:bg-[var(--palette-dark-olive)]"
                            : current
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-[var(--palette-charcoal-olive)] hover:bg-[var(--palette-sand)]",
                        )}
                      >
                        {current && !item.primary && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full"
                          />
                        )}

                        <Icon
                          aria-hidden="true"
                          className={cn(
                            "h-4 w-4 transition-colors",
                            !current && !item.primary &&
                              "text-[var(--palette-dark-olive)] group-hover:text-primary",
                          )}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                </div>
            </DrawerContent>
          </Drawer>
        </div>
  )
}
