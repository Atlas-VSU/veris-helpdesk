"use client";

import { useState } from "react";
import { EmailVerificationForm } from "@/features/tickets/components/email-verification-form";
import { OtpVerificationForm } from "@/features/tickets/components/otp-verification-form";
import { useEmailVerification } from "@/features/tickets/hooks/use-email-verification";

type RequestedCode = {
  email: string;
  message: string;
};

export function EmailVerificationFlow() {
  const [requestedCode, setRequestedCode] = useState<RequestedCode | null>(null);
  const {
    secondsUntilResend,
    isResending,
    resendError,
    resendMessage,
    resendCode,
    startResendCountdown,
  } = useEmailVerification(requestedCode?.email ?? null);

  if (requestedCode) {
    return (
      <OtpVerificationForm
        email={requestedCode.email}
        requestMessage={resendMessage ?? requestedCode.message}
        secondsUntilResend={secondsUntilResend}
        isResending={isResending}
        resendError={resendError}
        onResend={resendCode}
        onChangeEmail={() => setRequestedCode(null)}
      />
    );
  }

  return (
    <EmailVerificationForm
      onCodeRequested={(email, message) => {
        startResendCountdown();
        setRequestedCode({ email, message });
      }}
    />
  );
}
