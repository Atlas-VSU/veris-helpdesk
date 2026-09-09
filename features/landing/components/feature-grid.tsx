import { features } from "../data/features";
import { FeatureCard } from "./feature-card";

export function FeatureGrid() {
  return (
    <section
      aria-label="Support features"
      className="grid gap-6 md:grid-cols-3"
    >
      {features.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </section>
  );
}
