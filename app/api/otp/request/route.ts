import { NextResponse, after } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { otpRequestSchema } from "@/features/tickets/schemas/otp";
import {
  generateOtpCode,
  hashOtpCode,
  OTP_EXPIRES_MINUTES,
  OTP_RESEND_SECONDS,
} from "@/lib/otp";
import { sendOtpEmail } from "@/lib/otp-email";
import { errorResponse, handleApiError, parseJsonBody } from "@/lib/api-error";

const SUCCESS_MESSAGE = "If this email has tickets, a code was sent.";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const parsed = otpRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        400,
        parsed.error.issues[0]?.message ?? "Invalid email address",
      );
    }

    const email = parsed.data.email;
    const supabase = getSupabaseServerClient();

    // 1. Resend wait. Works the same for every email.
    const { data: latest } = await supabase
      .from("otp_verifications")
      .select("created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest) {
      const secondsSince =
        (Date.now() - new Date(latest.created_at).getTime()) / 1000;

      if (secondsSince < OTP_RESEND_SECONDS) {
        const retryAfterSeconds = Math.ceil(OTP_RESEND_SECONDS - secondsSince);
        return errorResponse(
          429,
          `Please wait ${retryAfterSeconds} seconds before asking for a new code.`,
          {
            code: "OTP_RESEND_WAIT",
            details: { retryAfterSeconds },
          },
        );
      }
    }

    // 2. Does this email have any tickets?
    const { count, error: countError } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("email", email);

    if (countError) throw countError;
    const hasTickets = (count ?? 0) > 0;

    // 3. Make a new code and hash it
    const code = generateOtpCode();
    const hash = await hashOtpCode(code);

    // 4. Older codes stop working
    const { error: expireError } = await supabase
      .from("otp_verifications")
      .update({ used: true })
      .eq("email", email)
      .eq("used", false);

    if (expireError) throw expireError;

    // 5. Save the new code
    const { error: insertError } = await supabase
      .from("otp_verifications")
      .insert({
        email,
        code: hash,
        expires_at: new Date(
          Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000,
        ).toISOString(),
      });

    if (insertError) throw insertError;

    // 6. Send the email AFTER the response, only if there are tickets
    if (hasTickets) {
      after(() => sendOtpEmail(email, code));
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch (err) {
    return handleApiError(err, { context: "OTP request error" });
  }
}
