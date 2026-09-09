import Link from "next/link";
import { Menu } from "lucide-react";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/tickets", label: "My Tickets" },
  { href: "/submit-ticket", label: "Submit Ticket" },
];

type PublicHeaderProps = {
  activeHref?: string;
};

export function PublicHeader({ activeHref }: PublicHeaderProps) {
  return (
    <header className="border-b border-[#DED8CF] bg-[#FDFCF8]">
      <nav className="mx-auto hidden h-20 max-w-[1440px] items-center justify-between px-12 md:flex">
        <Link className="font-serif text-2xl font-semibold tracking-tight text-[#45573B]" href="/">
          VERIS
        </Link>
        <div className="flex items-center gap-8 text-sm font-bold text-[#78786C]">
          {navigationItems.map((item) => (
            <Link
              className={item.href === activeHref ? "border-b-2 border-[#45573B] pb-1 text-[#45573B]" : "transition-colors hover:text-[#45573B]"}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <Link className="text-sm font-bold transition-colors hover:text-[#45573B]" href="/admin/login">
          Login
        </Link>
      </nav>
      <nav className="flex h-16 items-center justify-between px-4 md:hidden">
        <Link className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#45573B]" href="/">
          <Menu aria-hidden="true" className="size-5" />
          VERIS
        </Link>
      </nav>
    </header>
  );
}