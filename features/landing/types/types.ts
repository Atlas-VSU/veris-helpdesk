import type { LucideIcon } from "lucide-react";

export type FeatureTone = "moss" | "terracotta" | "stone";

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: FeatureTone;
}