import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }
  const supabase = getSupabaseServerClient();

  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, email, password_hash, full_name")
    .eq("email", email)
    .single();

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

  const token = jwt.sign(
    { adminId: admin.id, email: admin.email },
    process.env.JWT_SECRET!,
    { expiresIn: "24h" },
  );

  const response = NextResponse.json({
    message: "Login successful",
    admin: { id: admin.id, email: admin.email, full_name: admin.full_name },
  });

  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 *24,
    path: '/',
  })

  return response;
}
