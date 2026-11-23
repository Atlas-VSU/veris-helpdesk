"use client";

import { AlertCircle } from "lucide-react";
import { useSubmitTicket } from "@/features/submit-ticket/hooks/use-submit-ticket";
import { TicketForm } from "@/features/submit-ticket/components/ticket-form";
import { TicketSuccessState } from "@/features/submit-ticket/components/ticket-success-state";

export default function SubmitTicketPage() {
  const {
    formData,
    errors,
    attachmentPreviewUrl,
    fileName,
    fileSize,
    fileInputKey,
    hasDraftContent,
    isAttachmentRejected,
    isValidatingAttachment,
    isSubmitting,
    hasSubmitted,
    ticketNumber,
    submittedData,
    error,
    handleInputChange,
    handleSelectChange,
    handleConsentChange,
    handleFileChange,
    handleDropFile,
    handleClearFile,
    captchaResetKey,
    handleCaptchaError,
    handleCaptchaTokenChange,
    handleSubmit,
    handleMakeAnotherTicket,
  } = useSubmitTicket();

  const content = hasSubmitted && ticketNumber && submittedData ? (
    <TicketSuccessState
      ticketNumber={ticketNumber}
      email={submittedData.email}
      subject={submittedData.subject}
      service={submittedData.service}
      priority={submittedData.priority}
      description={submittedData.description}
      onSubmitAnother={handleMakeAnotherTicket}
    />
  ) : (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Submit a Ticket</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground md:text-lg">We&apos;re here to help. Tell us what you need, and we&apos;ll get back to you shortly.</p>
      </div>

      {error && (
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <TicketForm
        formData={formData}
        errors={errors}
        attachmentPreviewUrl={attachmentPreviewUrl}
        fileName={fileName}
        fileSize={fileSize}
        fileInputKey={fileInputKey}
        hasDraftContent={hasDraftContent}
        isAttachmentRejected={isAttachmentRejected}
        isValidatingAttachment={isValidatingAttachment}
        isSubmitting={isSubmitting}
        onCancel={handleMakeAnotherTicket}
        onConsentChange={handleConsentChange}
        onFileChange={handleFileChange}
        onClearFile={handleClearFile}
        onDropFile={handleDropFile}
        captchaResetKey={captchaResetKey}
        onCaptchaError={handleCaptchaError}
        onCaptchaTokenChange={handleCaptchaTokenChange}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        onSubmit={handleSubmit}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 md:px-12 md:py-12">
        {content}
      </main>
    </div>
  );
}
