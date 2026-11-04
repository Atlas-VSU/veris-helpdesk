import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminCookieOptions } from "@/lib/admin-token";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });

  response.cookies.set(ADMIN_COOKIE_NAME, "", getAdminCookieOptions(0));

  return response;
}
