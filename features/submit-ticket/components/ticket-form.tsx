import Link from "next/link";
import { Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  TicketFormProps,
} from "@/features/submit-ticket/types/types";
import { FieldWithLabel, FileUploadField } from "@/features/submit-ticket/components/form-fields";

export function TicketForm({
  formData,
  fileName,
  isSubmitting,
  onInputChange,
  onSelectChange,
  onConsentChange,
  onFileChange,
  onCancel,
  onSubmit,
}: TicketFormProps) {
  return (
    <form className="rounded-3xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-6 shadow-soft md:p-10" onSubmit={onSubmit}>
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" onChange={onInputChange} placeholder="Jane Doe" required value={formData.fullName} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" onChange={onInputChange} placeholder="jane@example.com" required type="email" value={formData.email} />
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
            <Select id="service" name="service" onChange={onSelectChange} value={formData.service}>
              <option value="">Select a service...</option>
              <option>Billing</option>
              <option>Technical Support</option>
              <option>General Inquiry</option>
            </Select>
          </FieldWithLabel>
        </div>

        <FieldWithLabel id="subject" label="Subject">
          <Input id="subject" name="subject" onChange={onInputChange} placeholder="Brief summary of the issue" required value={formData.subject} />
        </FieldWithLabel>
        <FieldWithLabel id="description" label="Description">
          <Textarea className="resize-none" id="description" name="description" onChange={onInputChange} placeholder="Please provide as much detail as possible..." required rows={5} value={formData.description} />
        </FieldWithLabel>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <FieldWithLabel id="priority" label="Priority Level" withSelectIcon>
              <Select id="priority" name="priority" onChange={onSelectChange} value={formData.priority}>
                <option value="low">Low (Minor issue)</option>
                <option value="medium">Medium (Standard request)</option>
                <option value="high">High (Significant impact)</option>
                <option value="urgent">Urgent (System-down)</option>
              </Select>
            </FieldWithLabel>
            <p className="mt-1 text-xs text-[var(--palette-gray-olive)]">Priority Low: Minor issue, Priority Urgent: System-down</p>
          </div>
          <FieldWithLabel id="contactMethod" label="Preferred Contact Method" withSelectIcon>
            <Select id="contactMethod" name="contactMethod" onChange={onSelectChange} value={formData.contactMethod}>
              <option>Email</option>
              <option>Phone</option>
            </Select>
          </FieldWithLabel>
        </div>

        <FileUploadField fileName={fileName} onChange={onFileChange} />

        <div className="space-y-6 border-t border-[var(--palette-stone)] pt-6">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[var(--palette-dark-olive)]" htmlFor="consent">
            <input checked={formData.consent} className="mt-1 size-4 rounded border-[var(--palette-stone)] accent-[var(--palette-dark-olive)]" id="consent" name="consent" onChange={onConsentChange} required type="checkbox" />
            <span>I consent to the collection and processing of my data for the purpose of handling this request according to the <Link className="text-[var(--palette-dark-olive)] underline" href="/privacy">Privacy Policy</Link>.</span>
          </label>
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