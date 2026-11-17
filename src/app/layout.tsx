import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader, SiteHeaderFallback } from "@/components/site/site-header";
import { AppFeedbackToast } from "@/components/site/app-feedback-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoChitral | Discover the Hindukush",
  description:
    "Discover Chitral's valleys, local stays, and experiences with GoChitral. Plan your journey through the Hindukush.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<SiteHeaderFallback />}><SiteHeader /></Suspense>
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Suspense fallback={null}><AppFeedbackToast /></Suspense>
      </body>
    </html>
  );
}
