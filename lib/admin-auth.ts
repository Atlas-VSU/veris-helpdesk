import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-token";
import type { AdminSession } from "@/lib/admin-token";

// Protected admin handlers must call this before accessing data or making changes.
export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : null;
}
