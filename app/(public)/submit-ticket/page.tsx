"use client";

import { useSubmitTicket } from "@/features/submit-ticket/hooks/use-submit-ticket";
import { TicketForm } from "@/features/submit-ticket/components/ticket-form";
import { TicketSuccessState } from "@/features/submit-ticket/components/ticket-success-state";

export default function SubmitTicketPage() {
  const {
    formData,
    fileName,
    isSubmitting,
    hasSubmitted,
    handleInputChange,
    handleSelectChange,
    handleConsentChange,
    handleFileChange,
    handleSubmit,
    handleMakeAnotherTicket,
  } = useSubmitTicket();

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
      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 md:px-12 md:py-16">
        {content}
      </main>
    </div>
  );
}
