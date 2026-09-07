"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { navigationItems } from "../navigationItems";

export default function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <>
        <Link
          href="/"
          aria-label="VERIS helpdesk home"
          className="group flex items-center gap-2.5 transition-transform duration-normal active:scale-98 md:gap-3.5"
        >
          <Avatar className="size-9 after:hidden md:size-10">
            <AvatarImage src="/veris-icon.png" alt="VERIS logo" />
            <AvatarFallback className="bg-(--palette-moss) font-serif text-base font-extrabold text-(--palette-off-white)">
              V
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col ">
            <span className="font-bold text-foreground tracking-tight text-lg font-serif leading-none">
              VERIS
            </span>
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
              Helpdesk
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-0.5 font-semibold sm:flex lg:gap-2"
        >
          {navigationItems.map((item) => {
            const current = item.isCurrent(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-2 py-2 font-sans text-xs whitespace-nowrap transition-all duration-normal md:px-3 lg:px-4 lg:text-sm",
                  current
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-primary hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center sm:flex">
          <Link
            href="/admin/login"
            className="group flex items-center gap-2 px-6 py-3 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground shadow-soft hover:shadow-float hover:bg-secondary/90 hover:scale-[1.06] active:scale-95 transition-all duration-300"
          >
            <LogIn
              aria-hidden="true"
              className="size-3.5 md:size-4"
              strokeWidth={1.75}
            />
            Admin Login
          </Link>
        </div>
    </>
        
  )

}
