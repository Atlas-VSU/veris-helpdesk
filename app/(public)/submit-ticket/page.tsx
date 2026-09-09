"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { PublicHeader } from "@/components/layout/public-header";
import { TicketForm } from "@/features/submit-ticket/components/ticket-form";
import { TicketSuccessState } from "@/features/submit-ticket/components/ticket-success-state";
import type { TicketFormData } from "@/features/submit-ticket/types/types";

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
  const [ticketNumber, setTicketNumber] = useState("");

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          user_type: formData.userType,
          service: formData.service,
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          consent_given: formData.consent,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to submit ticket");
      }

      setTicketNumber(result.ticketNumber);
      setHasSubmitted(true);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleMakeAnotherTicket() {
    setFormData(initialFormData);
    setFileName("");
    setTicketNumber("");
    setHasSubmitted(false);
  }

  const content = hasSubmitted ? (
    <TicketSuccessState description={formData.description} email={formData.email} onSubmitAnother={handleMakeAnotherTicket} ticketNumber={ticketNumber} />
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
