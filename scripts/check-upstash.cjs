/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node setup check. */
const { loadEnvConfig } = require("@next/env");
const { Redis } = require("@upstash/redis");
const { Ratelimit } = require("@upstash/ratelimit");
const { randomUUID } = require("node:crypto");

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    console.error("Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN before running this check.");
    process.exitCode = 1;
    return;
  }

  try {
    const redis = new Redis({ url, token });
    await redis.ping();
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1, "60 s"),
      prefix: "ratelimit:setup-check",
      ephemeralCache: false,
    });
    // Use a separate, expiring key so the check does not consume user quotas.
    const result = await limiter.limit(randomUUID());
    if (!result.success || result.reason === "timeout") {
      throw new Error("Rate limit check failed");
    }
    console.log("Upstash connection and rate-limit writes verified.");
  } catch {
    // SDK errors may contain credentials; never print them.
    console.error("Upstash verification failed. Check credentials, write permissions, and Redis availability.");
    process.exitCode = 1;
  }
}

main();
