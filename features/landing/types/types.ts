import type { LucideIcon } from "lucide-react";
import type { FeatureTone } from "../types/feature-tone";

export type FeatureTone = "moss" | "terracotta" | "stone";

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: FeatureTone;
}