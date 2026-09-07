import { CheckCircle2, PencilLine, Search } from "lucide-react";
import { FeatureCard } from "./feature-card";

const features = [
  {
    title: "Submit a Request",
    description:
      "Provide details about your issue so we can start helping right away.",
    icon: PencilLine,
    tone: "moss" as const,
  },
  {
    title: "Track Your Ticket",
    description: "Monitor the progress of your active requests in real-time.",
    icon: Search,
    tone: "terracotta" as const,
  },
  {
    title: "Quick Resolution",
    description:
      "Our dedicated team works to resolve your issues promptly and efficiently.",
    icon: CheckCircle2,
    tone: "stone" as const,
  },
];

export function FeatureGrid() {
  return (
    <section aria-label="Support features" className="grid gap-6 md:grid-cols-3">
      {features.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </section>
  );
}