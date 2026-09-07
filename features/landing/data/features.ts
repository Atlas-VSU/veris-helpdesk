import { CheckCircle2, PencilLine, Search } from "lucide-react";
import type { FeatureCardProps } from "../interfaces/feature-card-props";

export const features: FeatureCardProps[] = [
  {
    title: "Submit a Request",
    description:
      "Provide details about your issue so we can start helping right away.",
    icon: PencilLine,
    tone: "moss",
  },
  {
    title: "Track Your Ticket",
    description: "Monitor the progress of your active requests in real-time.",
    icon: Search,
    tone: "terracotta",
  },
  {
    title: "Quick Resolution",
    description:
      "Our dedicated team works to resolve your issues promptly and efficiently.",
    icon: CheckCircle2,
    tone: "stone",
  },
];
