"use client";

import { ChangeEvent, FormEvent, useState } from "react";
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

export function useSubmitTicket() {
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
    setHasSubmitted(true);
    setIsSubmitting(false);
  }

  function handleMakeAnotherTicket() {
    setFormData(initialFormData);
    setFileName("");
    setHasSubmitted(false);
  }

  return {
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
  };
}
