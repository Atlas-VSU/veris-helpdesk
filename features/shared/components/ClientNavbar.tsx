import MobileDrawer from "./MobileDrawer";
import DesktopNavigation from "./DesktopNavigation";

export function ClientNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full px-6 pt-5 sm:px-8 md:pt-8 lg:px-12">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-full border border-[var(--palette-stone)] bg-[var(--palette-warm-white)]/90 px-5 shadow-soft backdrop-blur-md transition-all duration-300 md:h-[4.5rem] md:px-7">
        {/* Desktop navigation */}
        <DesktopNavigation />

        {/* Mobile navigation */}
        <MobileDrawer />
      </div>
    </header>
  );
}

export default ClientNavbar;
