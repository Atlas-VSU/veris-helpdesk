import { cookies } from "next/headers";
import { CLIENT_COOKIE_NAME, verifyClientToken } from "@/lib/client-token";

export async function getClientEmail(): Promise<string | null> {
  const token = (await cookies()).get(CLIENT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyClientToken(token);
}