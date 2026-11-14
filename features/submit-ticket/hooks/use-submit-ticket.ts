"use client";

import { ChangeEvent, DragEvent, FormEvent, useRef, useState } from "react";
import type { TicketFormData, TicketFormErrors } from "@/features/submit-ticket/types/types";
import { validateAttachmentMetadata } from "@/features/submit-ticket/attachment-validation";

import { submitTicketAction } from "../actions";

const initialFormData: TicketFormData = {
  fullName: "",
  email: "",
  userType: "subscriber",
  service: "",
  subject: "",
  description: "",
  priority: "low",
  consent: false,
};

export function useSubmitTicket() {
  const [formData, setFormData] = useState<TicketFormData>(initialFormData);
  const [errors, setErrors] = useState<TicketFormErrors>({});
  const [attachment, setAttachment] = useState<File | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<TicketFormData | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const submissionPending = useRef(false);

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name as keyof TicketFormErrors];
      return next;
    });
  }

  function handleSelectChange(name: "userType" | "service" | "priority", value: string | null) {
    setFormData((current) => ({ ...current, [name]: value ?? "" } as TicketFormData));
    setErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name as keyof TicketFormErrors];
      return next;
    });
  }

  function handleConsentChange(event: ChangeEvent<HTMLInputElement>) {
    setFormData((current) => ({ ...current, consent: event.target.checked }));
    setErrors((current) => {
      if (!current.consent) return current;
      const next = { ...current };
      delete next.consent;
      return next;
    });
  }

  function handleFileChange(file: File | null) {
    if (!file) {
      setAttachment(null);
      return;
    }

    const attachmentError = validateAttachmentMetadata(file);
    if (attachmentError) {
      setAttachment(null);
      setErrors((current) => ({ ...current, attachment: attachmentError }));
      return;
    }

    setAttachment(file);
    setErrors((current) => {
      if (!current.attachment) return current;
      const next = { ...current };
      delete next.attachment;
      return next;
    });
  }

  function handleDropFile(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    handleFileChange(event.dataTransfer.files.item(0));
  }

  function handleClearFile() {
    setAttachment(null);
    setErrors((current) => {
      if (!current.attachment) return current;
      const next = { ...current };
      delete next.attachment;
      return next;
    });
  }

  function handleCaptchaTokenChange(token: string) {
    setCaptchaToken(token);
    if (!token) return;
    setErrors((current) => {
      if (!current.captcha) return current;
      const next = { ...current };
      delete next.captcha;
      return next;
    });
  }

  function handleCaptchaError(message: string) {
    setCaptchaToken("");
    setErrors((current) => ({ ...current, captcha: message }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionPending.current) return;

    const nextErrors: TicketFormErrors = {};
    const trimmedEmail = formData.email.trim();

    if (!formData.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!trimmedEmail) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!formData.service) nextErrors.service = "Please select a service.";
    if (!formData.subject.trim()) nextErrors.subject = "Subject is required.";
    if (!formData.description.trim()) nextErrors.description = "Description is required.";
    if (!formData.priority) nextErrors.priority = "Please select a priority.";
    if (!formData.consent) nextErrors.consent = "You must agree to the privacy policy.";
    if (!captchaToken) nextErrors.captcha = "Please complete the spam protection check.";
    if (attachment) {
      const attachmentError = validateAttachmentMetadata(attachment);
      if (attachmentError) nextErrors.attachment = attachmentError;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    submissionPending.current = true;
    formRef.current = event.currentTarget;
    setIsSubmitting(true);
    setError(null);
    setErrors({});
    setHasSubmitted(false);
    setTicketNumber(null);
    setSubmittedData(null);

    try {
      // Keep the confirmation tied to this submission, even if fields change while awaiting it.
      const submissionSnapshot = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() : value,
        ]),
      ) as TicketFormData;
      const formDataObj = new FormData(event.currentTarget);
      formDataObj.delete("attachment");
      if (attachment) formDataObj.set("attachment", attachment);
      formDataObj.set("cf-turnstile-response", captchaToken);

      Object.entries(submissionSnapshot).forEach(([key, value]) => {
        formDataObj.set(
          key,
          typeof value === "boolean" ? (value ? "on" : "") : value,
        );
      });

      const result = await submitTicketAction(formDataObj);
      
      if (result.error) {
        setError(result.error);
        setCaptchaToken("");
        setCaptchaResetKey((current) => current + 1);
      } else if (
        result.success === true &&
        typeof result.ticketNumber === "string" &&
        result.ticketNumber.trim().length > 0
      ) {
        const normalizedTicketNumber = result.ticketNumber.trim();
        setTicketNumber(normalizedTicketNumber);
        setSubmittedData(submissionSnapshot);
        setHasSubmitted(true);
      } else {
        setError("We couldn't confirm your submission. Please contact support before submitting again.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError("An unexpected error occurred. Please try again.");
      setCaptchaToken("");
      setCaptchaResetKey((current) => current + 1);
    } finally {
      submissionPending.current = false;
      setIsSubmitting(false);
    }
  }


  function handleMakeAnotherTicket() {
    // Avoid clearing the form while its submission is still being processed.
    if (submissionPending.current) return;

    formRef.current?.reset();
    setFormData(initialFormData);
    setAttachment(null);
    setCaptchaToken("");
    setCaptchaResetKey((current) => current + 1);
    setHasSubmitted(false);
    setError(null);
    setErrors({});
    setTicketNumber(null);
    setSubmittedData(null);
  }

  return {
    formData,
    errors,
    fileName: attachment?.name ?? "",
    captchaResetKey,
    isSubmitting,
    hasSubmitted,
    error,
    ticketNumber,
    submittedData,
    handleInputChange,
    handleSelectChange,
    handleConsentChange,
    handleFileChange,
    handleDropFile,
    handleClearFile,
    handleCaptchaError,
    handleCaptchaTokenChange,
    handleSubmit,
    handleMakeAnotherTicket,
  };
}
