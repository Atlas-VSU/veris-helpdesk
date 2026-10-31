"use client";

import Link from "next/link";
import { Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect as Select } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type {
  TicketFormProps,
} from "@/features/submit-ticket/types/types";
import { FieldWithLabel, FileUploadField } from "@/features/submit-ticket/components/form-fields";

export function TicketForm({
  formData,
  errors,
  fileName,
  isSubmitting,
  onInputChange,
  onSelectChange,
  onConsentChange,
  onFileChange,
  onCancel,
  onSubmit,
}: TicketFormProps) {
  const errorMessage = (field: keyof typeof errors) => errors[field];
  const [isPriorityHelpOpen, setIsPriorityHelpOpen] = useState(false);

  return (
    <form className="rounded-3xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-6 shadow-soft md:p-10" noValidate onSubmit={onSubmit}>
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="fullName">Full Name</Label>
            <Input aria-describedby={errorMessage("fullName") ? "fullName-error" : undefined} aria-invalid={Boolean(errorMessage("fullName"))} id="fullName" name="fullName" onChange={onInputChange} placeholder="Jane Doe" required value={formData.fullName} />
            {errorMessage("fullName") && <p className="text-xs text-red-700" id="fullName-error">{errorMessage("fullName")}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email Address</Label>
            <Input aria-describedby={errorMessage("email") ? "email-error" : undefined} aria-invalid={Boolean(errorMessage("email"))} id="email" name="email" onChange={onInputChange} placeholder="jane@example.com" required type="email" value={formData.email} />
            {errorMessage("email") && <p className="text-xs text-red-700" id="email-error">{errorMessage("email")}</p>}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FieldWithLabel id="userType" label="User Type" withSelectIcon>
            <Select id="userType" name="userType" onChange={onSelectChange} value={formData.userType}>
              <option value="subscriber">Subscriber</option>
              <option value="student">Student</option>
            </Select>
          </FieldWithLabel>
          <FieldWithLabel id="service" label="Service / Product" withSelectIcon>
            <Select aria-describedby={errorMessage("service") ? "service-error" : undefined} aria-invalid={Boolean(errorMessage("service"))} id="service" name="service" onChange={onSelectChange} value={formData.service}>
              <option value="">Select a service...</option>
              <option>Billing</option>
              <option>Technical Support</option>
              <option>General Inquiry</option>
            </Select>
            {errorMessage("service") && <p className="mt-1 text-xs text-red-700" id="service-error">{errorMessage("service")}</p>}
          </FieldWithLabel>
        </div>

        <FieldWithLabel id="subject" label="Subject">
          <Input aria-describedby={errorMessage("subject") ? "subject-error" : undefined} aria-invalid={Boolean(errorMessage("subject"))} id="subject" name="subject" onChange={onInputChange} placeholder="Brief summary of the issue" required value={formData.subject} />
          {errorMessage("subject") && <p className="text-xs text-red-700" id="subject-error">{errorMessage("subject")}</p>}
        </FieldWithLabel>
        <FieldWithLabel id="description" label="Description">
          <Textarea aria-describedby={errorMessage("description") ? "description-error" : undefined} aria-invalid={Boolean(errorMessage("description"))} className="resize-none" id="description" name="description" onChange={onInputChange} placeholder="Please provide as much detail as possible..." required rows={5} value={formData.description} />
          {errorMessage("description") && <p className="text-xs text-red-700" id="description-error">{errorMessage("description")}</p>}
        </FieldWithLabel>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <FieldWithLabel
              id="priority"
              label={
                <span className="flex items-center gap-2">
                  <span>Priority Level</span>
                  <span className="group relative">
                    <button aria-describedby="priority-help-tooltip" aria-expanded={isPriorityHelpOpen} aria-label="Learn about priority levels" className="flex size-5 items-center justify-center rounded-full border border-[var(--palette-gray-olive)] text-xs font-bold text-[var(--palette-gray-olive)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--palette-moss)]" onClick={() => setIsPriorityHelpOpen((open) => !open)} type="button">?</button>
                    <span className={`absolute bottom-full left-1/2 z-10 mb-2 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-[var(--palette-dark-olive)] p-3 text-xs leading-5 text-[var(--palette-warm-white)] shadow-lg ${isPriorityHelpOpen ? "block" : "hidden"}`} id="priority-help-tooltip" role="tooltip">
                      <span className="block"><strong>Low:</strong> Minor issue with little or no impact.</span>
                      <span className="block"><strong>Medium:</strong> Standard request or issue affecting normal work.</span>
                      <span className="block"><strong>High:</strong> Important issue affecting a major feature or multiple users.</span>
                      <span className="block"><strong>Urgent:</strong> System outage or critical issue needing immediate attention.</span>
                    </span>
                  </span>
                </span>
              }
              withSelectIcon
            >
              <Select aria-describedby={errorMessage("priority") ? "priority-error" : undefined} aria-invalid={Boolean(errorMessage("priority"))} id="priority" name="priority" onChange={onSelectChange} value={formData.priority}>
                <option value="low">Low (Minor issue)</option>
                <option value="medium">Medium (Standard request)</option>
                <option value="high">High (Significant impact)</option>
                <option value="urgent">Urgent (System-down)</option>
              </Select>
            </FieldWithLabel>
            {errorMessage("priority") && <p className="mt-1 text-xs text-red-700" id="priority-error">{errorMessage("priority")}</p>}
          </div>
        </div>

        <FileUploadField fileName={fileName} onChange={onFileChange} />

        <div className="space-y-6 border-t border-[var(--palette-stone)] pt-6">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[var(--palette-dark-olive)]" htmlFor="consent">
            <input aria-describedby={errorMessage("consent") ? "consent-error" : undefined} aria-invalid={Boolean(errorMessage("consent"))} checked={formData.consent} className="mt-1 size-4 rounded border-[var(--palette-stone)] accent-[var(--palette-dark-olive)]" id="consent" name="consent" onChange={onConsentChange} required type="checkbox" />
            <span>I consent to the collection and processing of my data for the purpose of handling this request according to the <Link className="text-[var(--palette-dark-olive)] underline" href="/privacy">Privacy Policy</Link>.</span>
          </label>
          {errorMessage("consent") && <p className="text-xs text-red-700" id="consent-error">{errorMessage("consent")}</p>}
          <div className="flex w-fit items-center gap-2 rounded-lg border border-[var(--palette-stone)] bg-[var(--palette-off-white)] px-3 py-2 text-sm italic text-[var(--palette-gray-olive)]">
            <ShieldCheck aria-hidden="true" className="size-4" />
            <span>[ CAPTCHA Placeholder ]</span>
          </div>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-end gap-6">
              <Button className="text-[var(--palette-gray-olive)] hover:bg-transparent hover:text-[var(--palette-charcoal-olive)]" onClick={onCancel} type="button" variant="ghost">Cancel</Button>
              <Button className="bg-[var(--palette-dark-olive)] px-6 py-3 text-[var(--palette-white)] hover:bg-[var(--palette-moss)]" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
                <Send aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}