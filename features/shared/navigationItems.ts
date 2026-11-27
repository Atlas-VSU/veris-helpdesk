import { CircleHelp, House, TicketPlus, Tickets } from "lucide-react";

import type { NavigationItem } from "@/features/shared/types";

export const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Home",
    icon: House,
    isCurrent: (pathname) => pathname === "/",
  },
  {
    href: "/verify",
    label: "My Tickets",
    icon: Tickets,
    isCurrent: (pathname) =>
      pathname === "/verify" || pathname.startsWith("/tickets"),
  },
  {
    href: "/faq",
    label: "FAQ",
    icon: CircleHelp,
    isCurrent: (pathname) => pathname === "/faq",
  },
];

export const primaryNavAction: NavigationItem = {
  href: "/submit-ticket",
  label: "Submit Ticket",
  icon: TicketPlus,
  isCurrent: (pathname) => pathname === "/submit-ticket",
};
