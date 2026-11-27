import { House, TicketPlus, Tickets } from "lucide-react";

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
    href: "/submit-ticket",
    label: "Submit a Ticket",
    icon: TicketPlus,
    primary: true,
    isCurrent: (pathname) => pathname === "/submit-ticket",
  },
];
