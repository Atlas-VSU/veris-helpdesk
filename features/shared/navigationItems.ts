import { House, TicketPlus, Tickets } from "lucide-react";

import type { NavigationItem } from "@/features/types";

export const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Home",
    icon: House,
    isCurrent: (pathname) => pathname === "/",
  },
  {
    href: "/submit-ticket",
    label: "Submit Ticket",
    icon: TicketPlus,
    isCurrent: (pathname) => pathname === "/submit-ticket",
  },
  {
    href: "/verify",
    label: "View Ticket",
    icon: Tickets,
    isCurrent: (pathname) =>
      pathname === "/verify" || pathname.startsWith("/tickets"),
  },
];
