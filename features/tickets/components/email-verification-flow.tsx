"use client";

import { useState } from "react";
import { EmailVerificationForm } from "@/features/tickets/components/email-verification-form";
import { OtpVerificationForm } from "@/features/tickets/components/otp-verification-form";

type RequestedCode = {
  email: string;
  message: string;
};

export function EmailVerificationFlow() {
  const [requestedCode, setRequestedCode] = useState<RequestedCode | null>(null);

  if (requestedCode) {
    return (
      <OtpVerificationForm
        email={requestedCode.email}
        requestMessage={requestedCode.message}
        onChangeEmail={() => setRequestedCode(null)}
      />
    );
  }

  return (
    <EmailVerificationForm
      onCodeRequested={(email, message) => setRequestedCode({ email, message })}
    />
  );
}
