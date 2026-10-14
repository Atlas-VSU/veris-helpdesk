import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

function createRedis(): Redis | null {
  if (!upstashUrl || !upstashToken) return null;
  try {
    return new Redis({ url: upstashUrl, token: upstashToken });
  } catch {
    // Treat invalid configuration as unavailable rather than crashing imports.
    return null;
  }
}

const redis = createRedis();

export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "ratelimit:login",
    })
  : null;

export const ticketSubmissionRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "ratelimit:ticket",
    })
  : null;

export const otpRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "5 m"),
      prefix: "ratelimit:otp",
    })
  : null;

// Login and OTP must never proceed without a successful Redis check in production.
export async function checkAuthRateLimit(
  limiter: Pick<Ratelimit, "limit"> | null,
  identifier: string,
) {
  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Authentication rate limiting is not configured");
    }
    return null;
  }

  try {
    const result = await limiter.limit(identifier);
    // Upstash allows requests on timeout by default, even with success: true.
    if (result.reason === "timeout") throw new Error("Rate limit check timed out");
    return result;
  } catch {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Authentication rate limiting is unavailable");
    }
    return null;
  }
}
