"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { submitTicket } from "@/features/submit-ticket/api/submit-ticket";
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
      const submittedTicketNumber = await submitTicket(formData);
      setTicketNumber(submittedTicketNumber);
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

  return {
    formData,
    fileName,
    isSubmitting,
    hasSubmitted,
    ticketNumber,
    handleInputChange,
    handleSelectChange,
    handleConsentChange,
    handleFileChange,
    handleSubmit,
    handleMakeAnotherTicket,
  };
}
