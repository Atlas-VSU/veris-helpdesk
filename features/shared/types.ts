import type { LucideIcon } from "lucide-react";

// NavigationItem type definition
export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isCurrent: (pathname: string) => boolean;
};
