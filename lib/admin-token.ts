import jwt from "jsonwebtoken";

export const ADMIN_COOKIE_NAME = "admin_session";

export type AdminSession = jwt.JwtPayload & { adminId: string };

export function verifyAdminToken(token: string): AdminSession | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload === "string" || payload.role === "client") return null;
    if (typeof payload.adminId !== "string" || !payload.adminId.trim()) return null;
    return payload as AdminSession;
  } catch {
    return null;
  }
}
