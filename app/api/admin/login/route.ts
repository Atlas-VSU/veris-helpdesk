import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AdminRow } from "@/types/database";
import { loginRateLimit } from "@/lib/rate-limit";
import { adminLoginSchema } from "@/features/admin/schemas/admin";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  const { success } = await loginRateLimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later" },
      { status: 429 },
    );
  }
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const result = adminLoginSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  try {
    const { email, password } = result.data;
    const supabase = getSupabaseServerClient();

    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, email, password_hash, full_name")
      .eq("email", email)
      .single<AdminRow>();

    if (error || !admin) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
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
    console.error("Admin login error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}