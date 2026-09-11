import { Card, CardContent } from "@/components/ui/card";
import type { FeatureCardProps } from "../types/types.ts";

const toneStyles = {
  moss: {
    icon: "bg-[var(--palette-moss)] text-[var(--palette-off-white)]",
  },
  terracotta: {
    icon: "bg-[var(--palette-terracotta)] text-[var(--palette-off-white)]",
  },
  stone: {
    icon: "bg-[var(--palette-dark-olive)] text-[var(--palette-off-white)]",
  },
} as const;

export function FeatureCard({
  title,
  description,
  icon: Icon,
  tone,
}: FeatureCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card
      className="group mx-auto w-full max-w-[26rem] items-center rounded-[1.5rem] border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] py-5 text-center shadow-[0_20px_40px_rgba(93,112,82,0.05)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[var(--palette-moss)]/40 hover:shadow-[0_26px_50px_rgba(93,112,82,0.12)] sm:max-w-none sm:rounded-[1.75rem] sm:py-6"
    >
      <CardContent className="flex flex-col items-center px-4 sm:px-6">
        <div
          className={`mb-3 flex size-14 items-center justify-center rounded-full transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-[0_12px_24px_rgba(93,112,82,0.14)] sm:size-16 ${styles.icon}`}
        >
          <Icon aria-hidden="true" className="size-6 sm:size-7" strokeWidth={1.8} />
        </div>
        <h2 className="font-serif text-[2rem] font-medium leading-tight text-[var(--palette-charcoal-olive)] transition-colors duration-300 group-hover:text-[var(--palette-moss)] sm:text-2xl sm:leading-8">
          {title}
        </h2>
        <p className="mt-1 font-sans text-sm leading-5 text-[var(--palette-dark-olive)] transition-colors duration-300 group-hover:text-[var(--palette-charcoal-olive)]">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
