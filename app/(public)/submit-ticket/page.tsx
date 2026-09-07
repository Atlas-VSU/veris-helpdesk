"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { CheckCircle2, ChevronDown, Menu, Send, ShieldCheck, Upload, X } from "lucide-react";
import type { TicketPriority, UserType } from "@/types/database";

const inputClassName =
  "w-full rounded-lg border border-[#DED8CF] bg-[#E6DCCD]/20 px-3 py-3 text-base text-[#2C2C24] outline-none transition focus:border-[#45573B] focus:ring-4 focus:ring-[#5D7052]/15";

type TicketFormData = {
  fullName: string;
  email: string;
  userType: UserType;
  service: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  contactMethod: "Email" | "Phone";
  consent: boolean;
};

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

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-[0.04em] text-[#2C2C24]" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select className={`${inputClassName} appearance-none pr-10`} id={id} name={id} onChange={onChange} value={value}>
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#78786C]" />
      </div>
    </div>
  );
}

export default function SubmitTicketPage() {
  const [formData, setFormData] = useState<TicketFormData>(initialFormData);
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
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

    if (hasSubmitted) {
      setIsConfirmationOpen(true);
      return;
    }

    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setHasSubmitted(true);
      setIsConfirmationOpen(true);
    }, 400);
  }

  function handleMakeAnotherTicket() {
    setFormData(initialFormData);
    setFileName("");
    setHasSubmitted(false);
    setIsConfirmationOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2C2C24]">
      <header className="border-b border-[#DED8CF] bg-[#FDFCF8]">
        <nav className="mx-auto hidden h-20 max-w-[1440px] items-center justify-between px-12 md:flex">
          <Link className="font-serif text-2xl font-semibold tracking-tight text-[#45573B]" href="/">
            VERIS
          </Link>
          <div className="flex items-center gap-8 text-sm font-bold text-[#78786C]">
            <Link className="transition-colors hover:text-[#45573B]" href="/">Home</Link>
            <Link className="transition-colors hover:text-[#45573B]" href="/tickets">My Tickets</Link>
            <Link className="border-b-2 border-[#45573B] pb-1 text-[#45573B]" href="/submit-ticket">Submit Ticket</Link>
          </div>
          <Link className="text-sm font-bold transition-colors hover:text-[#45573B]" href="/admin/login">Login</Link>
        </nav>
        <nav className="flex h-16 items-center justify-between px-4 md:hidden">
          <Link className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#45573B]" href="/">
            <Menu aria-hidden="true" className="size-5" />
            VERIS
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 md:px-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h1 className="font-serif text-4xl font-semibold text-[#45573B] md:text-5xl">Submit a Request</h1>
            <p className="mt-3 text-lg leading-7 text-[#4A4A40]">We&apos;re here to help. Tell us what you need, and we&apos;ll get back to you shortly.</p>
          </div>

          <form className="rounded-3xl border border-[#DED8CF] bg-[#FEFEFA] p-6 shadow-[0_20px_40px_rgba(93,112,82,0.08)] md:p-10" onSubmit={handleSubmit}>
            <div className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-[0.04em]" htmlFor="fullName">Full Name</label>
                  <input className={inputClassName} id="fullName" name="fullName" onChange={handleInputChange} placeholder="Jane Doe" required type="text" value={formData.fullName} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-[0.04em]" htmlFor="email">Email Address</label>
                  <input className={inputClassName} id="email" name="email" onChange={handleInputChange} placeholder="jane@example.com" required type="email" value={formData.email} />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <SelectField id="userType" label="User Type" onChange={handleSelectChange} value={formData.userType}>
                  <option value="subscriber">Subscriber</option>
                  <option value="student">Student</option>
                </SelectField>
                <SelectField id="service" label="Service / Product" onChange={handleSelectChange} value={formData.service}>
                  <option value="">Select a service...</option>
                  <option>Billing</option>
                  <option>Technical Support</option>
                  <option>General Inquiry</option>
                </SelectField>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-[0.04em]" htmlFor="subject">Subject</label>
                <input className={inputClassName} id="subject" name="subject" onChange={handleInputChange} placeholder="Brief summary of the issue" required type="text" value={formData.subject} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-[0.04em]" htmlFor="description">Description</label>
                <textarea className={`${inputClassName} resize-none`} id="description" name="description" onChange={handleInputChange} placeholder="Please provide as much detail as possible..." required rows={5} value={formData.description} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <SelectField id="priority" label="Priority Level" onChange={handleSelectChange} value={formData.priority}>
                    <option value="low">Low (Minor issue)</option>
                    <option value="medium">Medium (Standard request)</option>
                    <option value="high">High (Significant impact)</option>
                    <option value="urgent">Urgent (System-down)</option>
                  </SelectField>
                  <p className="mt-1 text-xs text-[#78786C]">Priority Low: Minor issue, Priority Urgent: System-down</p>
                </div>
                <SelectField id="contactMethod" label="Preferred Contact Method" onChange={handleSelectChange} value={formData.contactMethod}>
                  <option>Email</option>
                  <option>Phone</option>
                </SelectField>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-[0.04em]">Attachments</span>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#DED8CF] bg-[#E6DCCD]/10 p-8 text-center transition hover:bg-[#E6DCCD]/20" htmlFor="attachment">
                  <Upload aria-hidden="true" className="size-8 text-[#78786C]" />
                  <span className="text-base text-[#4A4A40]">Drag and drop files here, or <span className="font-bold text-[#45573B] underline">browse</span></span>
                  <span className="text-xs text-[#78786C]">{fileName || "Max file size: 10MB"}</span>
                </label>
                <input className="sr-only" id="attachment" key={fileName || "empty"} name="attachment" onChange={handleFileChange} type="file" />
              </div>

              <div className="space-y-6 border-t border-[#DED8CF] pt-6">
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[#4A4A40]" htmlFor="consent">
                  <input checked={formData.consent} className="mt-1 size-4 rounded border-[#DED8CF] accent-[#45573B]" id="consent" name="consent" onChange={handleConsentChange} required type="checkbox" />
                  <span>I consent to the collection and processing of my data for the purpose of handling this request according to the <Link className="text-[#45573B] underline" href="/privacy">Privacy Policy</Link>.</span>
                </label>
                <div className="flex w-fit items-center gap-2 rounded-lg border border-[#DED8CF] bg-[#E5E3D6] px-3 py-2 text-sm italic text-[#78786C]">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  <span>[ CAPTCHA Placeholder ]</span>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-end gap-6">
                    <button className="text-sm font-bold text-[#78786C] transition-colors hover:text-[#2C2C24]" onClick={handleMakeAnotherTicket} type="button">Cancel</button>
                    <button className="flex items-center justify-center gap-2 rounded-lg bg-[#45573B] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#5D7052] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting || hasSubmitted} type="submit">
                      {isSubmitting ? "Submitting..." : hasSubmitted ? "Ticket Submitted" : "Submit Ticket"}
                      <Send aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                  {hasSubmitted && (
                    <div className="w-full rounded-xl border border-[#B8CDA9] bg-[#D4E9C4]/45 p-4 text-[#3A4C30]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="flex items-center gap-2 text-left text-sm font-bold">
                          <CheckCircle2 aria-hidden="true" className="size-5" />
                          This ticket has already been submitted.
                        </p>
                        <button className="w-full rounded-lg border border-[#45573B] px-4 py-2 text-sm font-bold text-[#45573B] transition-colors hover:bg-[#45573B] hover:text-white sm:w-auto" onClick={handleMakeAnotherTicket} type="button">
                          Make a new ticket
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {isConfirmationOpen && (
        <div aria-labelledby="ticket-submitted-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2C24]/45 px-4 py-6" role="dialog">
          <div className="relative w-full max-w-md rounded-2xl border border-[#DED8CF] bg-[#FEFEFA] p-8 text-center shadow-[0_20px_40px_rgba(44,44,36,0.2)]">
            <button aria-label="Close confirmation" className="absolute right-4 top-4 rounded-full p-2 text-[#78786C] transition hover:bg-[#E6DCCD]/30 hover:text-[#2C2C24]" onClick={() => setIsConfirmationOpen(false)} type="button">
              <X aria-hidden="true" className="size-5" />
            </button>
            <CheckCircle2 aria-hidden="true" className="mx-auto size-14 text-[#45573B]" />
            <h2 className="mt-5 font-serif text-3xl font-semibold text-[#45573B]" id="ticket-submitted-title">Ticket submitted</h2>
            <p className="mt-3 text-base leading-6 text-[#4A4A40]">Your support request has been submitted. We&apos;ll get back to you shortly.</p>
            <button className="mt-7 w-full rounded-lg bg-[#45573B] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#5D7052]" onClick={handleMakeAnotherTicket} type="button">
              Make another ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
