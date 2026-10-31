"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import type { TicketFormData, TicketFormErrors } from "@/features/submit-ticket/types/types";

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
  const [fileName, setFileName] = useState("");
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

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value } as TicketFormData));
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    formRef.current = event.currentTarget.form;
    setFileName(event.target.files?.[0]?.name ?? "");
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

      Object.entries(submissionSnapshot).forEach(([key, value]) => {
        formDataObj.set(
          key,
          typeof value === "boolean" ? (value ? "on" : "") : value,
        );
      });

      const result = await submitTicketAction(formDataObj);
      
      if (result.error) {
        setError(result.error);
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
    setFileName("");
    setHasSubmitted(false);
    setError(null);
    setErrors({});
    setTicketNumber(null);
    setSubmittedData(null);
  }

  return {
    formData,
    errors,
    fileName,
    isSubmitting,
    hasSubmitted,
    error,
    ticketNumber,
    submittedData,
    handleInputChange,
    handleSelectChange,
    handleConsentChange,
    handleFileChange,
    handleSubmit,
    handleMakeAnotherTicket,
  };
}
