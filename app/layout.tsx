import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Footer } from "@/features/shared/index";

// Brand Sans-Serif Font
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

// Brand Serif Font (for editorial/special headings)
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VERIS Helpdesk",
  description: "Warm, reliable support from the VERIS team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        nunito.variable,
        fraunces.variable,
        "font-sans",
      )}
    >
      <body className="flex min-h-screen flex-col bg-background text-foreground font-sans">
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
