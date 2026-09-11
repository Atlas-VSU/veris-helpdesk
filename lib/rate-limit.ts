import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = upstashUrl && upstashToken
  ? new Redis({ url: upstashUrl, token: upstashToken })
  : null;

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
