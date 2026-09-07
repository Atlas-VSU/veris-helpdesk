import { Card, CardContent } from "@/components/ui/card";
import type { FeatureCardProps } from "../types/types.ts";

const toneStyles = {
  moss: {
    icon: "bg-[var(--palette-moss)] text-white",
    corner: "rounded-tl-sm",
  },
  terracotta: {
    icon: "bg-[var(--palette-terracotta)] text-white",
    corner: "rounded-tr-sm",
  },
  stone: {
    icon: "bg-[var(--palette-dark-olive)] text-white",
    corner: "rounded-br-sm",
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
      className={`items-center rounded-[2rem] border-[var(--palette-stone)] bg-[var(--palette-warm-white)] py-6 text-center shadow-[0_20px_40px_rgba(93,112,82,0.05)] transition-shadow hover:shadow-[0_20px_40px_rgba(93,112,82,0.12)] ${styles.corner}`}
    >
      <CardContent className="flex flex-col items-center px-6">
        <div
          className={`mb-3 flex size-16 items-center justify-center rounded-full ${styles.icon}`}
        >
          <Icon aria-hidden="true" className="size-7" strokeWidth={1.8} />
        </div>
        <h2 className="font-serif text-2xl font-medium leading-8 text-[var(--palette-charcoal-olive)]">
          {title}
        </h2>
        <p className="mt-1 font-sans text-sm leading-5 text-[var(--palette-dark-olive)]">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
