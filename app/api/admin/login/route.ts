import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AdminRow } from "@/types/database";
import { checkAuthRateLimit, loginRateLimit } from "@/lib/rate-limit";
import { adminLoginSchema } from "@/features/admin/schemas/admin";
import { errorResponse, handleApiError, parseJsonBody } from "@/lib/api-error";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  try {
    const result = await checkAuthRateLimit(loginRateLimit, ip);
    if (result && !result.success) {
      return errorResponse(429, "Too many login attempts. Please try again later");
    }
  } catch (error) {
    return handleApiError(error, {
      context: "Login rate limiting is unavailable",
    });
  }

  try {
    const body = await parseJsonBody(request);
    const result = adminLoginSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(400, result.error.issues[0].message);
    }

    const { email, password } = result.data;
    const supabase = getSupabaseServerClient();

    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, email, password_hash, full_name")
      .eq("email", email)
      .single<AdminRow>();

    if (error || !admin) {
      return errorResponse(401, "Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatches) {
      return errorResponse(401, "Invalid email or password");
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("Missing required env var: JWT_SECRET");
    }

    const token = jwt.sign({ adminId: admin.id, email: admin.email }, jwtSecret, {
      expiresIn: "24h",
    });

    const response = NextResponse.json({
      message: "Login successful",
      admin: { id: admin.id, email: admin.email, full_name: admin.full_name },
    });

    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (err) {
    return handleApiError(err, { context: "Admin login error" });
  }
}
