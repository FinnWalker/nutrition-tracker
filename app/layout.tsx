import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "react-image-crop/dist/ReactCrop.css";
import AuthSessionProvider from "./ui/auth-session-provider";
import "./globals.css";
import NavSidebar from "@/components/ui/NavSidebar";
import BottomNav from "@/components/ui/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nutrition Tracker",
  description: "An app to track your nutrition and macros.",
};

type RootLayoutProps = {
  auth: React.ReactNode;
  children: React.ReactNode;
};

export default function RootLayout(props: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh text-foreground">
        <AuthSessionProvider>
          <div className="min-h-dvh lg:h-dvh lg:min-h-0 lg:px-5 lg:py-5">
            <div className="mx-auto min-h-dvh lg:flex lg:h-[calc(100dvh-2.5rem)] lg:min-h-0 lg:max-w-[1380px] lg:gap-5 lg:overflow-hidden">
              <div className="hidden w-64 rounded-[1.75rem] border border-border bg-white shadow-sm lg:block lg:h-full lg:overflow-y-auto">
                <NavSidebar />
              </div>
              <main className="lg:flex lg:h-full lg:min-h-0 lg:flex-1">
                <div className="box-border min-h-[calc(100dvh-5rem)] bg-white px-6 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col lg:rounded-[1.75rem] lg:border lg:border-border lg:px-3 lg:py-3 lg:shadow-sm">
                  <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                    <div className="lg:px-9 lg:py-9">{props.children}</div>
                  </div>
                </div>
              </main>
            </div>
          </div>
          <BottomNav />
          <Suspense fallback={null}>{props.auth}</Suspense>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
