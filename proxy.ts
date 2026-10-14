import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ticketSubmissionRateLimit, otpRateLimit } from "@/lib/rate-limit";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-token";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  // The API contract keeps login and logout public, even for invalid sessions.
  const isPublicAdminRoute =
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout";

  if ((isAdminPage || isAdminApi) && !isPublicAdminRoute) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token || !verifyAdminToken(token)) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Only apply rate limiting to ticket submissions (POST requests)
  if (
    request.nextUrl.pathname.startsWith("/api/tickets") ||
    request.nextUrl.pathname.startsWith("/submit-ticket")
  ) {
    if (request.method === "POST") {
      const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

      try {
        if (!ticketSubmissionRateLimit) {
          return NextResponse.next();
        }

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
        if (!otpRateLimit) {
          return NextResponse.next();
        }

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
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/tickets/:path*",
    "/submit-ticket/:path*",
    "/api/otp/:path*",
    "/verify/:path*"
  ],
};
