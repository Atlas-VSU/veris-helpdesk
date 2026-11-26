"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminLogoutButtonProps = {
  className?: string;
  onLogoutSuccess?: () => void;
};

export function AdminLogoutButton({ className, onLogoutSuccess }: AdminLogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) {
        setLogoutError("Unable to sign out. Please try again.");
        setIsLoggingOut(false);
        return;
      }

      onLogoutSuccess?.();
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setLogoutError("Unable to sign out. Check your connection and try again.");
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={cn(
          "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60 duration-fast",
          className,
        )}
      >
        <LogOut aria-hidden="true" className="size-4 shrink-0" />
        {isLoggingOut ? "Signing out..." : "Logout"}
      </button>
      {logoutError && (
        <p role="alert" className="px-3 pt-1 text-xs font-medium text-destructive">
          {logoutError}
        </p>
      )}
    </div>
  );
}
