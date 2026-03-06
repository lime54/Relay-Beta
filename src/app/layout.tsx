import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontSerif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relay | Verified Athlete Network",
  description: "Connect with verified student-athletes and alumni for career advice.",
};

import { Suspense } from "react";
import { PageProgressBar } from "@/components/page-progress-bar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        suppressHydrationWarning
        className={`${fontSans.variable} ${fontSerif.variable} antialiased min-h-screen bg-background flex flex-col font-sans`}
      >
        <Suspense fallback={null}>
          <PageProgressBar />
        </Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
