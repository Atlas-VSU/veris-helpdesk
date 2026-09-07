import ClientNavbar from "@/features/shared/ClientNavbar";
import Footer from "@/features/shared/Footer";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <ClientNavbar />
      {children}
      <Footer />
    </>
  );
}
