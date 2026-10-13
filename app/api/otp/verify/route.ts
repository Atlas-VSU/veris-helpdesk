import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { otpVerifySchema } from "@/features/tickets/schemas/otp";
import { checkOtpCode, OTP_MAX_ATTEMPTS } from "@/lib/otp";
import {
  CLIENT_COOKIE_NAME,
  CLIENT_SESSION_SECONDS,
  signClientToken,
} from "@/lib/client-token";
import { WholeWord } from "lucide-react";

const EXPIRED = {
  error: "That code has expired. Please request a new one.",
  code: "OTP_EXPIRED",
};

const WRONG = { error: "That code is not correct.", code: "OTP_WRONG" };

const LOCKED = {
  error: "Too many wrong tries. Please request a new code.",
  code: "OTP_LOCKED",
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = otpVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email or code" },
      { status: 400 },
    );
  }

  const { email, code } = parsed.data;

  try {
    const supabase = getSupabaseServerClient();

    // 1. Newest code that is not used yet
    const { data: otp, error: findError } = await supabase
      .from("otp_verifications")
      .select("id, code, expires_at, attempts")
      .eq("email", email)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;

    // 2. No code, or the code is too old
    if (!otp || new Date(otp.expires_at).getTime() <= Date.now()) {
      return NextResponse.json(EXPIRED, { status: 401 });
    }

    // 3. Already locked
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json(LOCKED, { status: 429 });
    }

    // 4. Count this try BEFORE checking the code. The .eq("attempts", ...)
    //    makes the update work for only ONE of several parallel requests.
    const { data: claimed, error: claimError } = await supabase
      .from("otp_verifications")
      .update({ attempts: otp.attempts + 1 })
      .eq("id", otp.id)
      .eq("attempts", otp.attempts)
      .eq("used", false)
      .select("id")
      .maybeSingle();

    if (claimError) throw claimError;

    if (!claimed) {
      return NextResponse.json(
        { error: "Please try again in a moment." },
        { status: 429 },
      );
    }

    // 5. Check the typed code against the scrambled one
    const correct = await checkOtpCode(code, otp.code);

    if (!correct) {
      if (otp.attempts + 1 >= OTP_MAX_ATTEMPTS) {
        return NextResponse.json(LOCKED, { status: 429 });
      }
      return NextResponse.json(WRONG, { status: 401 });
    }

    // 6. Correct. Make the token first, so a missing JWT_SECRET
    //    does not use up the code.
    const token = signClientToken(email);

    const { data: used, error: useError } = await supabase
      .from("otp_verifications")
      .update({ used: true })
      .eq("id", otp.id)
      .eq("used", false)
      .select("id")
      .maybeSingle();

    if (useError) throw useError;

    if (!used) {
      return NextResponse.json(EXPIRED, { status: 401 });
    }

    // 7. Give the client their cookie
    const response = NextResponse.json({ message: "Verified", email });

    response.cookies.set(CLIENT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CLIENT_SESSION_SECONDS,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}