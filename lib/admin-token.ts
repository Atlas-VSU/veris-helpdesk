import jwt from "jsonwebtoken";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24; // 24 hours

export type AdminSession = jwt.JwtPayload & {
  adminId: string;
  email?: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing required env var: JWT_SECRET");
  return secret;
}

export function signAdminToken(payload: {
  adminId: string;
  email: string;
}): string {
  return jwt.sign(
    { adminId: payload.adminId, email: payload.email },
    getSecret(),
    { algorithm: "HS256", expiresIn: ADMIN_SESSION_SECONDS },
  );
}

export function getAdminCookieOptions(maxAge = ADMIN_SESSION_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

export function verifyAdminToken(token: string): AdminSession | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      maxAge: ADMIN_SESSION_SECONDS,
    });
    if (typeof payload === "string" || payload.role === "client") return null;
    if (typeof payload.adminId !== "string" || !payload.adminId.trim()) return null;
    if (typeof payload.exp !== "number") return null;
    if (
      typeof payload.iat === "number" &&
      payload.exp - payload.iat > ADMIN_SESSION_SECONDS
    ) {
      return null;
    }
    return payload as AdminSession;
  } catch {
    return null;
  }
}
