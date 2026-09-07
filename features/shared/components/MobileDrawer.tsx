"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LogIn, Menu } from "lucide-react";

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
              className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Toggle menu"
            >
              <Menu aria-hidden="true" className="w-5 h-5" />
            </DrawerTrigger>

            <DrawerContent className="[--drawer-inset:0.75rem] rounded-[2.5rem]! border border-border bg-card px-6 pt-2 pb-8 shadow-float max-h-[85vh] after:hidden">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-5" />
                <div className="space-y-6">
                <DrawerHeader className="text-left border-b border-border pb-5 p-0">
                  <DrawerTitle className="flex items-start justify-start gap-3.5 w-full">
                    <Avatar className="w-10 h-10 shrink-0 after:hidden">
                      <AvatarImage src="/veris-icon.png" alt="VERIS logo" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-serif font-bold text-sm">
                        V
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="font-bold text-foreground text-base font-serif leading-none">
                        VERIS
                      </span>
                      <span className="text-[10px] font-bold text-primary tracking-wider uppercase bg-muted px-2 py-0.5 rounded-full w-fit leading-none">
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
                          "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden group active:scale-98",
                          current
                            ? "text-primary bg-primary/5 font-semibold"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        {current && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full"
                          />
                        )}

                        <Icon
                          aria-hidden="true"
                          className={cn(
                            "w-4 h-4 transition-colors",
                            current
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                </div>

              <div className="pt-4 border-t border-border mt-6">
                <Link
                  href="/admin/login"
                  onClick={() => setIsOpen(false)}
                  style={{ borderRadius: "9999px" }}
                  className="flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-[9999px] bg-secondary px-5 text-xs font-semibold text-secondary-foreground shadow-soft transition-all hover:bg-secondary/90 active:scale-95"
                >
                  <LogIn
                    aria-hidden="true"
                    className="w-4 h-4"
                  />
                  Admin Login
                </Link>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
  )
}
