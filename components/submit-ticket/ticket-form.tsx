import Link from "next/link";
import { ChangeEvent, FormEvent } from "react";
import { Send, ShieldCheck } from "lucide-react";
import type { TicketFormData } from "@/types/database";
import { FileUploadField, SelectField, TextAreaField, TextField } from "@/components/submit-ticket/form-fields";

type TicketFormProps = {
  formData: TicketFormData;
  fileName: string;
  isSubmitting: boolean;
  onInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onConsentChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

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
    <form className="rounded-3xl border border-[#DED8CF] bg-[#FEFEFA] p-6 shadow-[0_20px_40px_rgba(93,112,82,0.08)] md:p-10" onSubmit={onSubmit}>
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <TextField id="fullName" label="Full Name" name="fullName" onChange={onInputChange} placeholder="Jane Doe" value={formData.fullName} />
          <TextField id="email" label="Email Address" name="email" onChange={onInputChange} placeholder="jane@example.com" type="email" value={formData.email} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SelectField id="userType" label="User Type" onChange={onSelectChange} value={formData.userType}>
            <option value="subscriber">Subscriber</option>
            <option value="student">Student</option>
          </SelectField>
          <SelectField id="service" label="Service / Product" onChange={onSelectChange} value={formData.service}>
            <option value="">Select a service...</option>
            <option>Billing</option>
            <option>Technical Support</option>
            <option>General Inquiry</option>
          </SelectField>
        </div>

        <TextField id="subject" label="Subject" name="subject" onChange={onInputChange} placeholder="Brief summary of the issue" value={formData.subject} />
        <TextAreaField id="description" label="Description" onChange={onInputChange} placeholder="Please provide as much detail as possible..." value={formData.description} />

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <SelectField id="priority" label="Priority Level" onChange={onSelectChange} value={formData.priority}>
              <option value="low">Low (Minor issue)</option>
              <option value="medium">Medium (Standard request)</option>
              <option value="high">High (Significant impact)</option>
              <option value="urgent">Urgent (System-down)</option>
            </SelectField>
            <p className="mt-1 text-xs text-[#78786C]">Priority Low: Minor issue, Priority Urgent: System-down</p>
          </div>
          <SelectField id="contactMethod" label="Preferred Contact Method" onChange={onSelectChange} value={formData.contactMethod}>
            <option>Email</option>
            <option>Phone</option>
          </SelectField>
        </div>

        <FileUploadField fileName={fileName} onChange={onFileChange} />

        <div className="space-y-6 border-t border-[#DED8CF] pt-6">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[#4A4A40]" htmlFor="consent">
            <input checked={formData.consent} className="mt-1 size-4 rounded border-[#DED8CF] accent-[#45573B]" id="consent" name="consent" onChange={onConsentChange} required type="checkbox" />
            <span>I consent to the collection and processing of my data for the purpose of handling this request according to the <Link className="text-[#45573B] underline" href="/privacy">Privacy Policy</Link>.</span>
          </label>
          <div className="flex w-fit items-center gap-2 rounded-lg border border-[#DED8CF] bg-[#E5E3D6] px-3 py-2 text-sm italic text-[#78786C]">
            <ShieldCheck aria-hidden="true" className="size-4" />
            <span>[ CAPTCHA Placeholder ]</span>
          </div>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-end gap-6">
              <button className="text-sm font-bold text-[#78786C] transition-colors hover:text-[#2C2C24]" onClick={onCancel} type="button">Cancel</button>
              <button className="flex items-center justify-center gap-2 rounded-lg bg-[#45573B] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#5D7052] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
                <Send aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}