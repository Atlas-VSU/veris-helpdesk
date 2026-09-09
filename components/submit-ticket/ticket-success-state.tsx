import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";

type TicketSuccessStateProps = {
  email: string;
  description: string;
  onSubmitAnother: () => void;
};

export function TicketSuccessState({ email, description, onSubmitAnother }: TicketSuccessStateProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl border border-[#DED8CF] bg-[#FEFEFA] p-6 text-center shadow-[0_20px_40px_rgba(93,112,82,0.08)] md:p-16">
      <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-[#D4E9C4] text-[#45573B] shadow-[0_20px_40px_rgba(93,112,82,0.08)]">
        <CheckCircle2 aria-hidden="true" className="size-12" />
      </div>
      <h1 className="font-serif text-3xl font-semibold text-[#45573B] md:text-4xl">Success! Your ticket has been submitted.</h1>
      <p className="mt-3 text-lg leading-7 text-[#4A4A40]">A confirmation email has been sent to <span className="font-bold text-[#45573B]">{email}</span>.</p>

      <div className="mt-10 w-full rounded-xl border border-[#C4C8BD]/50 bg-[#F6F4E7] p-6 text-left">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#444840]">Issue Summary</h2>
        <p className="mt-3 text-base leading-6 text-[#2C2C24]">{description}</p>
        <div className="mt-6 flex items-center gap-3 border-t border-[#C4C8BD]/50 pt-4 text-sm font-bold text-[#5D7052]">
          <Clock3 aria-hidden="true" className="size-5" />
          <span>Expected response time: Within 6-12 hours</span>
        </div>
      </div>

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link className="rounded-lg bg-[#45573B] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#5D7052]" href="/tickets">View Ticket</Link>
        <button className="rounded-lg bg-[#E5E3D6] px-6 py-3 text-sm font-bold text-[#444840] transition-colors hover:bg-[#C4C8BD]" onClick={onSubmitAnother} type="button">Submit Another</button>
        <Link className="rounded-lg border border-[#DED8CF] px-6 py-3 text-sm font-bold text-[#444840] transition-colors hover:border-[#45573B] hover:text-[#45573B]" href="/">Return Home</Link>
      </div>
    </div>
  );
}