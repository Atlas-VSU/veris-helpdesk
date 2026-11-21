"use client";

import Link from "next/link";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  PriorityOption,
  TicketFormProps,
  UserTypeOption,
} from "@/features/submit-ticket/types/types";
import { FieldWithLabel, FileUploadField } from "@/features/submit-ticket/components/form-fields";
import { TurnstileWidget } from "@/features/submit-ticket/components/turnstile-widget";

const MAX_SUBJECT_LENGTH = 200;

const USER_TYPE_OPTIONS: readonly UserTypeOption[] = [
  { value: "subscriber", label: "Subscriber" },
  { value: "student", label: "Student" },
];

const SERVICE_OPTIONS = ["Billing", "Technical Support", "General Inquiry"] as const;

const PRIORITY_OPTIONS: readonly PriorityOption[] = [
  {
    value: "low",
    label: "Low",
    description: "Minor issue, little impact",
    dotClassName: "bg-muted-foreground/60",
    selectedClassName: "border-primary bg-muted/70 ring-1 ring-primary/30",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Standard request or impact",
    dotClassName: "bg-primary",
    selectedClassName: "border-primary bg-accent/55 ring-1 ring-primary/30",
  },
  {
    value: "high",
    label: "High",
    description: "Major feature or team affected",
    dotClassName: "bg-warning",
    selectedClassName: "border-warning bg-warning/15 ring-1 ring-warning/35",
  },
  {
    value: "urgent",
    label: "Urgent",
    description: "Outage or critical blocker",
    dotClassName: "bg-destructive",
    selectedClassName: "border-destructive bg-destructive/10 ring-1 ring-destructive/30",
  },
];

export function TicketForm({
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
  onInputChange,
  onSelectChange,
  onConsentChange,
  onFileChange,
  onClearFile,
  onDropFile,
  captchaResetKey,
  onCaptchaError,
  onCaptchaTokenChange,
  onCancel,
  onSubmit,
}: TicketFormProps) {
  const errorMessage = (field: keyof typeof errors) => errors[field];
  const subjectCount = formData.subject.length;

  return (
    <form
      className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-10"
      noValidate
      onSubmit={onSubmit}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-4">
        <p className="text-xs text-muted-foreground">
          Fields marked with <span aria-hidden="true" className="font-semibold text-destructive">*</span> are required.
        </p>
        {hasDraftContent && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            Draft saved
          </span>
        )}
      </div>

      <div className="space-y-8">
        {/* Section 1: Contact Information */}
        <section aria-labelledby="contact-section-heading" className="space-y-5">
          <h2 className="font-serif text-lg font-semibold text-foreground" id="contact-section-heading">
            1. Contact Information
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName">
                Full Name <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                aria-describedby={errorMessage("fullName") ? "fullName-error" : undefined}
                aria-invalid={Boolean(errorMessage("fullName"))}
                autoComplete="name"
                className="h-11 bg-card"
                id="fullName"
                name="fullName"
                onChange={onInputChange}
                placeholder="Jane Doe"
                required
                value={formData.fullName}
              />
              {errorMessage("fullName") && (
                <p className="text-xs font-medium text-destructive" id="fullName-error" role="alert">
                  {errorMessage("fullName")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">
                Email Address <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                aria-describedby={errorMessage("email") ? "email-error" : undefined}
                aria-invalid={Boolean(errorMessage("email"))}
                autoComplete="email"
                className="h-11 bg-card"
                id="email"
                name="email"
                onChange={onInputChange}
                placeholder="jane@example.com"
                required
                type="email"
                value={formData.email}
              />
              {errorMessage("email") && (
                <p className="text-xs font-medium text-destructive" id="email-error" role="alert">
                  {errorMessage("email")}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-xs font-bold uppercase tracking-[0.04em] text-foreground">
                User Type <span aria-hidden="true" className="text-destructive">*</span>
              </legend>
              <div className="grid h-11 grid-cols-2 gap-1 rounded-lg border border-border bg-muted/60 p-1" role="radiogroup">
                {USER_TYPE_OPTIONS.map((option) => {
                  const isSelected = formData.userType === option.value;
                  return (
                    <label
                      className={`flex cursor-pointer items-center justify-center rounded-md text-sm font-semibold transition-colors has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                        isSelected
                          ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      key={option.value}
                    >
                      <input
                        checked={isSelected}
                        className="sr-only"
                        name="userType"
                        onChange={() => onSelectChange("userType", option.value)}
                        type="radio"
                        value={option.value}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <FieldWithLabel
              id="service"
              label={
                <>
                  Service / Product <span aria-hidden="true" className="text-destructive">*</span>
                </>
              }
            >
              <Select onValueChange={(value) => onSelectChange("service", value)} value={formData.service || null}>
                <SelectTrigger
                  aria-describedby={errorMessage("service") ? "service-error" : undefined}
                  aria-invalid={Boolean(errorMessage("service"))}
                  className="h-11 w-full border-input bg-card px-3 text-sm text-foreground data-[size=default]:h-11"
                  id="service"
                >
                  <SelectValue placeholder="Select a service...">
                    {formData.service || "Select a service..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border border-border bg-popover p-1 shadow-soft">
                  {SERVICE_OPTIONS.map((service) => (
                    <SelectItem
                      className="min-h-10 px-3 text-sm data-highlighted:bg-accent/50"
                      key={service}
                      value={service}
                    >
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errorMessage("service") && (
                <p className="text-xs font-medium text-destructive" id="service-error" role="alert">
                  {errorMessage("service")}
                </p>
              )}
            </FieldWithLabel>
          </div>
        </section>

        {/* Section 2: Issue Details */}
        <section aria-labelledby="issue-section-heading" className="space-y-5 border-t border-border pt-8">
          <h2 className="font-serif text-lg font-semibold text-foreground" id="issue-section-heading">
            2. Issue Details
          </h2>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="subject">
                Subject <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <span
                aria-live="polite"
                className={`text-xs tabular-nums ${
                  subjectCount >= MAX_SUBJECT_LENGTH - 10 ? "font-semibold text-destructive" : "text-muted-foreground"
                }`}
              >
                {subjectCount}/{MAX_SUBJECT_LENGTH}
              </span>
            </div>
            <Input
              aria-describedby={errorMessage("subject") ? "subject-error" : undefined}
              aria-invalid={Boolean(errorMessage("subject"))}
              className="h-11 bg-card"
              id="subject"
              maxLength={MAX_SUBJECT_LENGTH}
              name="subject"
              onChange={onInputChange}
              placeholder="Brief summary of the issue"
              required
              value={formData.subject}
            />
            {errorMessage("subject") && (
              <p className="text-xs font-medium text-destructive" id="subject-error" role="alert">
                {errorMessage("subject")}
              </p>
            )}
          </div>

          <FieldWithLabel
            id="description"
            label={
              <>
                Description <span aria-hidden="true" className="text-destructive">*</span>
              </>
            }
          >
            <Textarea
              aria-describedby={errorMessage("description") ? "description-error" : "description-help"}
              aria-invalid={Boolean(errorMessage("description"))}
              className="min-h-32 resize-y bg-card"
              id="description"
              name="description"
              onChange={onInputChange}
              placeholder="Please provide as much detail as possible..."
              required
              rows={5}
              value={formData.description}
            />
            <p className="text-xs text-muted-foreground" id="description-help">
              Include what happened, when it started, and any error messages.
            </p>
            {errorMessage("description") && (
              <p className="text-xs font-medium text-destructive" id="description-error" role="alert">
                {errorMessage("description")}
              </p>
            )}
          </FieldWithLabel>

          <fieldset
            aria-describedby={errorMessage("priority") ? "priority-error" : undefined}
            aria-invalid={Boolean(errorMessage("priority"))}
            className="flex flex-col gap-2"
          >
            <legend className="text-xs font-bold uppercase tracking-[0.04em] text-foreground">
              Priority Level <span aria-hidden="true" className="text-destructive">*</span>
            </legend>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup">
              {PRIORITY_OPTIONS.map((option) => {
                const isSelected = formData.priority === option.value;
                return (
                  <label
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 ${
                      isSelected
                        ? option.selectedClassName
                        : "border-border bg-card hover:border-input hover:bg-muted/35"
                    }`}
                    key={option.value}
                  >
                    <input
                      checked={isSelected}
                      className="sr-only"
                      id={`priority-${option.value}`}
                      name="priority"
                      onChange={() => onSelectChange("priority", option.value)}
                      type="radio"
                      value={option.value}
                    />
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span aria-hidden="true" className={`size-2 rounded-full ${option.dotClassName}`} />
                      {option.label}
                    </span>
                    <span className="text-xs leading-4 text-muted-foreground">{option.description}</span>
                  </label>
                );
              })}
            </div>
            {errorMessage("priority") && (
              <p className="text-xs font-medium text-destructive" id="priority-error" role="alert">
                {errorMessage("priority")}
              </p>
            )}
          </fieldset>
        </section>

        {/* Section 3: Attachments & Verification */}
        <section aria-labelledby="verification-section-heading" className="space-y-6 border-t border-border pt-8">
          <h2 className="font-serif text-lg font-semibold text-foreground" id="verification-section-heading">
            3. Attachments &amp; Verification
          </h2>

          <FileUploadField
            error={errorMessage("attachment")}
            fileInputKey={fileInputKey}
            fileName={fileName}
            fileSize={fileSize}
            isRejected={isAttachmentRejected}
            isValidating={isValidatingAttachment}
            onChange={onFileChange}
            onClear={onClearFile}
            onDrop={onDropFile}
            previewUrl={attachmentPreviewUrl}
          />

          <div className="space-y-2">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm leading-5 text-foreground transition-colors ${
                errorMessage("consent")
                  ? "border-destructive/70 bg-destructive/5"
                  : "border-border/80 bg-muted/40 hover:bg-muted/60"
              }`}
              htmlFor="consent"
            >
              <input
                aria-describedby={errorMessage("consent") ? "consent-error" : undefined}
                aria-invalid={Boolean(errorMessage("consent"))}
                checked={formData.consent}
                className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                id="consent"
                name="consent"
                onChange={onConsentChange}
                required
                type="checkbox"
              />
              <span>
                I consent to the collection and processing of my data for the purpose of handling this request according to the{" "}
                <Link className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80" href="/privacy">
                  Privacy Policy
                </Link>
                . <span aria-hidden="true" className="text-destructive">*</span>
              </span>
            </label>
            {errorMessage("consent") && (
              <p className="text-xs font-medium text-destructive" id="consent-error" role="alert">
                {errorMessage("consent")}
              </p>
            )}
          </div>

          <fieldset
            aria-describedby={errorMessage("captcha") ? "captcha-error" : undefined}
            aria-invalid={Boolean(errorMessage("captcha"))}
            className="focus:outline-none"
            id="captcha-section"
            tabIndex={-1}
          >
            <legend className="mb-2 text-xs font-bold uppercase tracking-[0.04em] text-foreground">
              Spam protection <span aria-hidden="true" className="text-destructive">*</span>
            </legend>
            <TurnstileWidget onError={onCaptchaError} onTokenChange={onCaptchaTokenChange} resetKey={captchaResetKey} />
            {errorMessage("captcha") && (
              <p className="mt-2 text-xs font-medium text-destructive" id="captcha-error" role="alert">
                {errorMessage("captcha")}
              </p>
            )}
          </fieldset>
        </section>

        {/* Footer Action Bar */}
        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">You&apos;ll receive a ticket number after submitting.</p>
            <p className="text-xs text-muted-foreground">Typical response time: within 6–12 hours.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              className="min-h-11 px-4 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              disabled={!hasDraftContent || isSubmitting}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Clear form
            </Button>
            <Button
              className="min-h-11 bg-primary px-6 font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:ring-ring"
              disabled={isSubmitting || isValidatingAttachment}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Ticket
                  <Send aria-hidden="true" className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
