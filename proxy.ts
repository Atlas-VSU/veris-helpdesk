import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ticketSubmissionRateLimit, otpRateLimit } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  // Only apply rate limiting to ticket submissions (POST requests)
  if (
    request.nextUrl.pathname.startsWith("/api/tickets") ||
    request.nextUrl.pathname.startsWith("/submit-ticket")
  ) {
    if (request.method === "POST") {
      const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

      try {
        const { success, limit, reset, remaining } = await ticketSubmissionRateLimit.limit(ip);

        if (!success) {
          return new NextResponse(
            JSON.stringify({ error: "Too many ticket submissions. Please try again later." }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset": reset.toString(),
              },
            }
          );
        }

        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", reset.toString());

        return response;
      } catch (error) {
        console.error("Rate limiting error:", error);
        // If Redis fails, allow the request to pass through to not break functionality
        return NextResponse.next();
      }
    }
  }

  // Apply rate limiting to OTP requests (POST)
  if (
    request.nextUrl.pathname.startsWith("/api/otp") ||
    request.nextUrl.pathname.startsWith("/verify")
  ) {
    if (request.method === "POST") {
      const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

      try {
        const { success, limit, reset, remaining } = await otpRateLimit.limit(ip);

        if (!success) {
          return new NextResponse(
            JSON.stringify({ error: "Too many OTP requests. Please try again later." }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset": reset.toString(),
              },
            }
          );
        }

        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", reset.toString());

        return response;
      } catch (error) {
        console.error("OTP rate limiting error:", error);
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/tickets/:path*",
    "/submit-ticket/:path*",
    "/api/otp/:path*",
    "/verify/:path*"
  ],
};
