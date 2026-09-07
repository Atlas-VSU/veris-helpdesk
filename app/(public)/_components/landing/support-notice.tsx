export function SupportNotice() {
  return (
    <aside className="mx-auto max-w-2xl rounded-3xl border border-[var(--palette-stone)] bg-[var(--palette-off-white)] px-6 py-5 text-center">
      <p className="font-sans text-base leading-6 text-[var(--palette-dark-olive)]">
        <strong className="text-[var(--palette-moss)]">
          Expected response time:
        </strong>{" "}
        Under 4 hours.
        <br />
        For emergencies, please call{" "}
        <a
          className="font-bold text-[var(--palette-terracotta)] hover:underline"
          href="tel:1800VERIS"
        >
          1-800-VERIS
        </a>
        .
      </p>
    </aside>
  );
}