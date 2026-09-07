"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { ChevronDown, Menu, Send, ShieldCheck, Upload } from "lucide-react";

const inputClassName =
  "w-full rounded-lg border border-[#DED8CF] bg-[#E6DCCD]/20 px-3 py-3 text-base text-[#2C2C24] outline-none transition focus:border-[#45573B] focus:ring-4 focus:ring-[#5D7052]/15";

function SelectField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-[0.04em] text-[#2C2C24]" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select className={`${inputClassName} appearance-none pr-10`} id={id} name={id}>
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#78786C]" />
      </div>
    </div>
  );
}

export default function SubmitTicketPage() {
  const [fileName, setFileName] = useState("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFileName(event.target.files?.[0]?.name ?? "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
                  <input className={inputClassName} id="fullName" name="fullName" placeholder="Jane Doe" required type="text" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-[0.04em]" htmlFor="email">Email Address</label>
                  <input className={inputClassName} id="email" name="email" placeholder="jane@example.com" required type="email" />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <SelectField id="userType" label="User Type">
                  <option>Subscriber</option>
                  <option>Student</option>
                  <option>Guest</option>
                </SelectField>
                <SelectField id="service" label="Service / Product">
                  <option value="">Select a service...</option>
                  <option>Billing</option>
                  <option>Technical Support</option>
                  <option>General Inquiry</option>
                </SelectField>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-[0.04em]" htmlFor="subject">Subject</label>
                <input className={inputClassName} id="subject" name="subject" placeholder="Brief summary of the issue" required type="text" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-[0.04em]" htmlFor="description">Description</label>
                <textarea className={`${inputClassName} resize-none`} id="description" name="description" placeholder="Please provide as much detail as possible..." required rows={5} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <SelectField id="priority" label="Priority Level">
                    <option value="low">Low (Minor issue)</option>
                    <option value="medium">Medium (Standard request)</option>
                    <option value="high">High (Significant impact)</option>
                    <option value="urgent">Urgent (System-down)</option>
                  </SelectField>
                  <p className="mt-1 text-xs text-[#78786C]">Priority Low: Minor issue, Priority Urgent: System-down</p>
                </div>
                <SelectField id="contactMethod" label="Preferred Contact Method">
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
                <input className="sr-only" id="attachment" name="attachment" onChange={handleFileChange} type="file" />
              </div>

              <div className="space-y-6 border-t border-[#DED8CF] pt-6">
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[#4A4A40]" htmlFor="consent">
                  <input className="mt-1 size-4 rounded border-[#DED8CF] accent-[#45573B]" id="consent" name="consent" required type="checkbox" />
                  <span>I consent to the collection and processing of my data for the purpose of handling this request according to the <Link className="text-[#45573B] underline" href="/privacy">Privacy Policy</Link>.</span>
                </label>
                <div className="flex w-fit items-center gap-2 rounded-lg border border-[#DED8CF] bg-[#E5E3D6] px-3 py-2 text-sm italic text-[#78786C]">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  <span>[ CAPTCHA Placeholder ]</span>
                </div>
                <div className="flex items-center justify-end gap-6 pt-2">
                  <button className="text-sm font-bold text-[#78786C] transition-colors hover:text-[#2C2C24]" type="button">Cancel</button>
                  <button className="flex items-center gap-2 rounded-lg bg-[#45573B] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#5D7052]" type="submit">
                    Submit Ticket
                    <Send aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
