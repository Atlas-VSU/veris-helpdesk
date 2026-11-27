"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { navigationItems, primaryNavAction } from "../navigationItems";

export default function DesktopNavigation() {
  const pathname = usePathname();
  const isPrimaryCurrent = primaryNavAction.isCurrent(pathname);
  const PrimaryIcon = primaryNavAction.icon;

  return (
    <>
      <Link
        href="/"
        aria-label="VERIS helpdesk home"
        className="group flex w-fit items-center gap-2.5 justify-self-start transition-transform duration-fast active:scale-98 md:gap-3.5"
      >
        <Avatar className="size-9 after:hidden md:size-10">
          <AvatarImage src="/veris-icon.png" alt="VERIS logo" />
          <AvatarFallback className="bg-primary font-serif text-base font-extrabold text-primary-foreground">
            V
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <span className="font-serif text-lg font-bold leading-none tracking-tight text-foreground">
            VERIS
          </span>
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
            Helpdesk
          </span>
        </div>
      </Link>

      {/* Desktop navigation */}
      <nav
        aria-label="Main navigation"
        className="hidden items-center justify-self-center gap-0.5 font-semibold sm:flex lg:gap-2"
      >
        {navigationItems.map((item) => {
          const current = item.isCurrent(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "relative rounded-full px-3 py-2 whitespace-nowrap font-sans text-xs transition-colors duration-fast md:px-3.5 lg:px-4 lg:text-sm",
                current
                  ? "bg-primary/10 font-bold text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-primary",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Primary client CTA */}
      <div className="hidden items-center justify-self-end sm:flex">
        <Link
          href={primaryNavAction.href}
          aria-current={isPrimaryCurrent ? "page" : undefined}
          className={cn(
            "inline-flex min-h-control items-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 font-sans text-xs font-semibold text-primary-foreground shadow-soft transition-all duration-fast hover:bg-primary/90 active:scale-[0.98] lg:px-6 lg:text-sm",
            isPrimaryCurrent &&
              "ring-2 ring-primary/30 ring-offset-2 ring-offset-card",
          )}
        >
          <PrimaryIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 md:size-4"
            strokeWidth={1.75}
          />
          {primaryNavAction.label}
        </Link>
      </div>
    </>
  );
}
