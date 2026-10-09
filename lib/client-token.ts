import jwt from "jsonwebtoken";

export const CLIENT_COOKIE_NAME = "client_session";
export const CLIENT_SESSION_SECONDS = 60 * 60 * 2; // 2 hours

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing required env var: JWT_SECRET");
  return secret;
}

// Used by the OTP verify route after a correct code.
export function signClientToken(email: string): string {
  return jwt.sign(
    { email: normalizeEmail(email), role: "client" },
    getSecret(),
    { algorithm: "HS256", expiresIn: CLIENT_SESSION_SECONDS },
  );
}

// Returns the email if the token is good, otherwise null.
export function verifyClientToken(token: string): string | null {
  const secret = getSecret();
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload === "string") return null;
    if (payload.role !== "client") return null;
    if (typeof payload.email !== "string") return null;
    return normalizeEmail(payload.email);
  } catch {
    return null; // fake, wrong secret, or expired
  }
}