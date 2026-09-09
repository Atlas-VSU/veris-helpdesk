"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { TicketFormData } from "@/types/database";
import { PublicHeader } from "@/components/layout/public-header";
import { TicketForm } from "@/features/submit-ticket/components/ticket-form";
import { TicketSuccessState } from "@/features/submit-ticket/components/ticket-success-state";

const initialFormData: TicketFormData = {
  fullName: "",
  email: "",
  userType: "subscriber",
  service: "",
  subject: "",
  description: "",
  priority: "low",
  contactMethod: "Email",
  consent: false,
};

export default function SubmitTicketPage() {
  const [formData, setFormData] = useState<TicketFormData>(initialFormData);
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value } as TicketFormData));
  }

  function handleConsentChange(event: ChangeEvent<HTMLInputElement>) {
    setFormData((current) => ({ ...current, consent: event.target.checked }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFileName(event.target.files?.[0]?.name ?? "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setHasSubmitted(true);
    }, 400);
  }

  function handleMakeAnotherTicket() {
    setFormData(initialFormData);
    setFileName("");
    setHasSubmitted(false);
  }

  const content = hasSubmitted ? (
    <TicketSuccessState description={formData.description} email={formData.email} onSubmitAnother={handleMakeAnotherTicket} />
  ) : (
    <div className="mx-auto max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl font-semibold text-[var(--palette-dark-olive)] md:text-5xl">Submit a Request</h1>
        <p className="mt-3 text-lg leading-7 text-[var(--palette-dark-olive)]">We&apos;re here to help. Tell us what you need, and we&apos;ll get back to you shortly.</p>
      </div>

      <TicketForm
        formData={formData}
        fileName={fileName}
        isSubmitting={isSubmitting}
        onCancel={handleMakeAnotherTicket}
        onConsentChange={handleConsentChange}
        onFileChange={handleFileChange}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        onSubmit={handleSubmit}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--palette-cream)] text-[var(--palette-charcoal-olive)]">
      <PublicHeader activeHref="/submit-ticket" />

      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 md:px-12 md:py-16">
        {content}
      </main>
    </div>
  );
}
