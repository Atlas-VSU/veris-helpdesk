import Link from "next/link";
import { ArrowRight } from "lucide-react";

const faqItems = [
  {
    question: "How do I submit a support ticket?",
    answer:
      "Complete the submit ticket form with your contact details, service, priority, and a description of the issue. Include as much detail as possible so our support team can help you quickly.",
  },
  {
    question: "How can I check the status of my ticket?",
    answer:
      "Use the My Tickets area after verifying your email address. You can search your tickets and filter them by their current status.",
  },
  {
    question: "What do the priority levels mean?",
    answer:
      "Low is for minor issues with little or no impact. Medium is for standard requests. High is for issues affecting an important feature or multiple users. Urgent is for a system outage or critical issue requiring immediate attention.",
  },
  {
    question: "How long does it take to receive a response?",
    answer:
      "Response times depend on the priority and complexity of your request. Our support team reviews every ticket and will respond as soon as possible.",
  },
  {
    question: "What file types can I attach?",
    answer:
      "Attachments should be JPG, PNG, or PDF files and must be no larger than 10MB.",
  },
  {
    question: "What should I do if I cannot access my tickets?",
    answer:
      "Start the email verification process again using the email address associated with your tickets. If you still need help, submit a new support request.",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[var(--palette-cream)] px-4 py-12 text-[var(--palette-charcoal-olive)] sm:px-6 md:px-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--palette-moss)]">
            Help center
          </p>
          <h1 className="font-serif text-4xl font-semibold text-[var(--palette-dark-olive)] md:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-7 text-[var(--palette-dark-olive)]">
            Find quick answers about submitting and tracking your support requests.
          </p>
        </div>

        <section aria-label="Frequently asked questions" className="space-y-3">
          {faqItems.map((item) => (
            <details
              className="group rounded-2xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] px-5 py-4 shadow-soft"
              key={item.question}
            >
              <summary className="cursor-pointer list-none pr-8 text-base font-semibold text-[var(--palette-dark-olive)] outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-[var(--palette-moss)] [&::-webkit-details-marker]:hidden">
                <span className="relative block after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:text-xl after:font-normal after:content-['+'] group-open:after:content-['−']">
                  {item.question}
                </span>
              </summary>
              <p className="pt-3 text-sm leading-6 text-[var(--palette-gray-olive)]">
                {item.answer}
              </p>
            </details>
          ))}
        </section>

        <div className="mt-12 rounded-2xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-6 text-center shadow-soft">
          <h2 className="font-serif text-2xl font-semibold text-[var(--palette-dark-olive)]">
            Still need help?
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--palette-gray-olive)]">
            Our support team is ready to help with your request.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--palette-dark-olive)] px-5 py-3 text-sm font-semibold text-[var(--palette-white)] transition-colors hover:bg-[var(--palette-moss)]"
            href="/submit-ticket"
          >
            Submit a ticket
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
