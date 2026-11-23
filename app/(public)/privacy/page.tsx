// privacy/ — Contains the public privacy page explaining how client data, ticket information, and uploaded files are handled.

import Link from "next/link";
import { privacyPolicy } from "@/features/privacy/data/privacy-policy";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-[var(--palette-charcoal-olive)]">
      <div className="rounded-3xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-6 shadow-soft md:p-10">
        <p className="mb-4 w-fit rounded-full bg-[var(--palette-clay)]/20 px-3 py-1 text-sm font-medium text-[var(--palette-dark-olive)]">
          {privacyPolicy.status}
        </p>
        <h1 className="font-serif text-4xl font-semibold text-[var(--palette-dark-olive)]">
          {privacyPolicy.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--palette-gray-olive)]">{privacyPolicy.updatedLabel}</p>
        <p className="mt-6 leading-7 text-[var(--palette-dark-olive)]">{privacyPolicy.introduction}</p>

        <div className="mt-10 space-y-8">
          {privacyPolicy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-xl font-semibold text-[var(--palette-dark-olive)]">
                {section.heading}
              </h2>
              <p className="mt-2 leading-7 text-[var(--palette-dark-olive)]">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 border-t border-[var(--palette-stone)] pt-6">
          <p className="text-sm text-[var(--palette-gray-olive)]">{privacyPolicy.contact.label}</p>
          <Link className="mt-4 inline-flex rounded-md bg-[var(--palette-dark-olive)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--palette-moss)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--palette-moss)] focus-visible:ring-offset-2" href={privacyPolicy.contact.href}>
            {privacyPolicy.contact.actionLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
