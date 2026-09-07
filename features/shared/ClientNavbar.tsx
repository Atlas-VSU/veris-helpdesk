import MobileDrawer from "./components/MobileDrawer";
import DesktopNavigation from "./components/DesktopNavigation";

export function ClientNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full px-6 sm:px-8 lg:px-12 pt-5 md:pt-8 flex flex-col items-center animate-fade-in-up">
      <div className="w-full max-w-7xl h-16 md:h-18 px-5 md:px-7 bg-card/90 backdrop-blur-md border border-border rounded-full shadow-soft flex items-center justify-between transition-all duration-300">
        {/* Desktop navigation */}
        <DesktopNavigation />

        {/* Mobile navigation */}
        <MobileDrawer />
      </div>
    </header>
  );
}

export default ClientNavbar;
