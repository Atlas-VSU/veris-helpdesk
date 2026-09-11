import { ClientNavbar, Footer } from "@/features/shared/index";


export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <ClientNavbar />
      {children}
      <Footer />
    </>
  );
}
