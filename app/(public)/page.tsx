import { FeatureGrid } from "../../features/landing/components/feature-grid";
import { LandingHero } from "../../features/landing/components/landing-hero";
import { SupportNotice } from "../../features/landing/components/support-notice";

export default function PublicHomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[var(--palette-cream)] px-4 py-16 sm:px-8 lg:px-12">
      <div className="w-full max-w-3xl space-y-10">
        <LandingHero />
        {/* <SupportNotice /> */}
        <FeatureGrid />
      </div>
    </main>
  );
}
