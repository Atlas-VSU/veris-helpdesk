import { TURNSTILE_ACTION } from "@/features/submit-ticket/turnstile-constants";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileVerificationResult = { success: boolean; action?: string };

export async function verifyTurnstileToken(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not configured.");
    return false;
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Turnstile verification request failed:", response.status);
      return false;
    }

    const result = (await response.json()) as TurnstileVerificationResult;
    return result.success && result.action === TURNSTILE_ACTION;
  } catch (error) {
    console.error("Turnstile verification request failed:", error);
    return false;
  }
}

