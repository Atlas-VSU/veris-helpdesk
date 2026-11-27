import MobileDrawer from "./MobileDrawer";
import DesktopNavigation from "./DesktopNavigation";

export function ClientNavbar() {
  return (
    <header className="sticky top-0 z-sticky w-full px-4 pt-4 sm:px-8 md:pt-6 lg:px-12">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-full border border-border bg-card/90 px-4 shadow-soft backdrop-blur-md transition-colors duration-normal sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-5 md:h-[4.5rem] md:px-7">
        {/* Desktop navigation */}
        <DesktopNavigation />

        {/* Mobile navigation */}
        <MobileDrawer />
      </div>
    </header>
  );
}

export default ClientNavbar;
