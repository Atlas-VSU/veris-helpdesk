import { Card, CardContent } from "@/components/ui/card";

export function SupportNotice() {
  return (
    <Card className="mx-auto max-w-2xl rounded-3xl border-[var(--palette-stone)] bg-[var(--palette-off-white)] py-5 text-center shadow-none">
      <CardContent className="px-6">
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
      </CardContent>
    </Card>
  );
}
