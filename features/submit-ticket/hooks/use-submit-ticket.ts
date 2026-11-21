"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type {
  RejectedAttachment,
  TicketFormData,
  TicketFormErrors,
} from "@/features/submit-ticket/types/types";
import {
  hasAcceptedAttachmentSignature,
  validateAttachmentMetadata,
} from "@/features/submit-ticket/attachment-validation";
import {
  clearTicketFormDraft,
  getTicketFormDraftServerSnapshot,
  getTicketFormDraftSnapshot,
  subscribeToTicketFormDraft,
  writeTicketFormDraft,
} from "@/features/submit-ticket/draft-storage";

import { submitTicketAction } from "../actions";

export function useSubmitTicket() {
  const formData = useSyncExternalStore(
    subscribeToTicketFormDraft,
    getTicketFormDraftSnapshot,
    getTicketFormDraftServerSnapshot,
  );
  const [errors, setErrors] = useState<TicketFormErrors>({});
  const [attachment, setAttachment] = useState<File | null>(null);
  const [rejectedAttachment, setRejectedAttachment] = useState<RejectedAttachment | null>(null);
  const [isValidatingAttachment, setIsValidatingAttachment] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<TicketFormData | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const submissionPending = useRef(false);
  const attachmentPreviewUrlRef = useRef<string | null>(null);
  const fileValidationIdRef = useRef(0);

  function clearAttachmentPreview() {
    if (attachmentPreviewUrlRef.current) {
      URL.revokeObjectURL(attachmentPreviewUrlRef.current);
      attachmentPreviewUrlRef.current = null;
    }
    setAttachmentPreviewUrl(null);
  }

  function setAttachmentPreview(file: File) {
    if (attachmentPreviewUrlRef.current) URL.revokeObjectURL(attachmentPreviewUrlRef.current);

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    attachmentPreviewUrlRef.current = previewUrl;
    setAttachmentPreviewUrl(previewUrl);
  }

  useEffect(() => () => {
    if (attachmentPreviewUrlRef.current) URL.revokeObjectURL(attachmentPreviewUrlRef.current);
  }, []);

  function updateFormData(updater: (current: TicketFormData) => TicketFormData) {
    const next = updater(getTicketFormDraftSnapshot());
    writeTicketFormDraft(next);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    updateFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name as keyof TicketFormErrors];
      return next;
    });
  }

  function handleSelectChange(name: "userType" | "service" | "priority", value: string | null) {
    updateFormData((current) => ({ ...current, [name]: value ?? "" } as TicketFormData));
    setErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name as keyof TicketFormErrors];
      return next;
    });
  }

  function handleConsentChange(event: ChangeEvent<HTMLInputElement>) {
    const { checked } = event.target;
    updateFormData((current) => ({ ...current, consent: checked }));
    setErrors((current) => {
      if (!current.consent) return current;
      const next = { ...current };
      delete next.consent;
      return next;
    });
  }

  async function handleFileChange(file: File | null) {
    const validationId = ++fileValidationIdRef.current;

    if (!file) {
      setIsValidatingAttachment(false);
      setAttachment(null);
      setRejectedAttachment(null);
      clearAttachmentPreview();
      setErrors((current) => {
        if (!current.attachment) return current;
        const next = { ...current };
        delete next.attachment;
        return next;
      });
      return;
    }

    const attachmentError = validateAttachmentMetadata(file);
    if (attachmentError) {
      setIsValidatingAttachment(false);
      setAttachment(null);
      setRejectedAttachment({ name: file.name, error: attachmentError });
      clearAttachmentPreview();
      setErrors((current) => ({ ...current, attachment: attachmentError }));
      return;
    }

    setIsValidatingAttachment(true);
    let hasValidSignature = false;
    try {
      hasValidSignature = await hasAcceptedAttachmentSignature(file);
    } catch {
      hasValidSignature = false;
    }

    if (validationId !== fileValidationIdRef.current) return;
    setIsValidatingAttachment(false);

    if (!hasValidSignature) {
      const signatureError = "The file contents do not match its declared type.";
      setAttachment(null);
      setRejectedAttachment({ name: file.name, error: signatureError });
      clearAttachmentPreview();
      setErrors((current) => ({ ...current, attachment: signatureError }));
      return;
    }

    setRejectedAttachment(null);
    setAttachment(file);
    setAttachmentPreview(file);
    setErrors((current) => {
      if (!current.attachment) return current;
      const next = { ...current };
      delete next.attachment;
      return next;
    });
  }

  function handleDropFile(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void handleFileChange(event.dataTransfer.files.item(0));
  }

  function handleClearFile() {
    fileValidationIdRef.current += 1;
    setIsValidatingAttachment(false);
    setAttachment(null);
    setRejectedAttachment(null);
    clearAttachmentPreview();
    setFileInputKey((current) => current + 1);
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
    if (submissionPending.current || isValidatingAttachment) return;

    const nextErrors: TicketFormErrors = {};
    const trimmedEmail = formData.email.trim();

    if (!formData.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!trimmedEmail) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!formData.service) nextErrors.service = "Please select a service.";
    if (!formData.subject.trim()) {
      nextErrors.subject = "Subject is required.";
    } else if (formData.subject.trim().length > 200) {
      nextErrors.subject = "Subject must be 200 characters or fewer.";
    }
    if (!formData.description.trim()) nextErrors.description = "Description is required.";
    if (!formData.priority) nextErrors.priority = "Please select a priority.";
    if (!formData.consent) nextErrors.consent = "You must agree to the privacy policy.";
    if (!captchaToken) nextErrors.captcha = "Please complete the spam protection check.";
    if (rejectedAttachment) {
      nextErrors.attachment = rejectedAttachment.error;
    } else if (attachment) {
      const attachmentError = validateAttachmentMetadata(attachment);
      if (attachmentError) nextErrors.attachment = attachmentError;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const fieldOrder: Array<{ key: keyof TicketFormErrors; id: string }> = [
        { key: "fullName", id: "fullName" },
        { key: "email", id: "email" },
        { key: "service", id: "service" },
        { key: "subject", id: "subject" },
        { key: "description", id: "description" },
        { key: "priority", id: "priority-low" },
        { key: "attachment", id: "attachment-dropzone" },
        { key: "consent", id: "consent" },
        { key: "captcha", id: "captcha-section" },
      ];
      const firstInvalid = fieldOrder.find(({ key }) => Boolean(nextErrors[key]));
      if (firstInvalid && typeof document !== "undefined") {
        const target = document.getElementById(firstInvalid.id);
        target?.focus({ preventScroll: false });
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
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
        clearTicketFormDraft();
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

    fileValidationIdRef.current += 1;
    clearTicketFormDraft();
    formRef.current?.reset();
    setIsValidatingAttachment(false);
    setAttachment(null);
    setRejectedAttachment(null);
    clearAttachmentPreview();
    setFileInputKey((current) => current + 1);
    setCaptchaToken("");
    setCaptchaResetKey((current) => current + 1);
    setHasSubmitted(false);
    setError(null);
    setErrors({});
    setTicketNumber(null);
    setSubmittedData(null);
  }

  const hasDraftContent = Boolean(
    formData.fullName.trim() ||
    formData.email.trim() ||
    formData.userType !== "subscriber" ||
    formData.service ||
    formData.subject.trim() ||
    formData.description.trim() ||
    formData.priority !== "low" ||
    formData.consent ||
    attachment ||
    rejectedAttachment,
  );

  return {
    formData,
    errors,
    attachmentPreviewUrl,
    fileName: attachment?.name ?? rejectedAttachment?.name ?? "",
    fileSize: attachment?.size ?? null,
    fileInputKey,
    hasDraftContent,
    isAttachmentRejected: Boolean(rejectedAttachment),
    isValidatingAttachment,
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
