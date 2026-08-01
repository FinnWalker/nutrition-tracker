import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "react-image-crop/dist/ReactCrop.css";
import AuthSessionProvider from "./ui/auth-session-provider";
import "./globals.css";
import NavSidebar from "@/components/ui/NavSidebar";
import BottomNav from "@/components/ui/BottomNav";
import Card from "@/components/ui/Card";

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
          <div className="min-h-dvh lg:flex lg:h-dvh lg:gap-4 lg:overflow-hidden lg:p-4">
            <Card className="hidden w-64 lg:block lg:h-full lg:overflow-y-auto">
              <NavSidebar />
            </Card>
            <main className="min-h-dvh pb-24 lg:flex lg:min-h-0 lg:flex-1 lg:pb-0">
              <div className="min-h-dvh bg-white px-6 py-6 lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col lg:rounded-xl lg:border lg:border-slate-200 lg:px-0 lg:py-0 lg:shadow">
                <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                  <div className="lg:px-8 lg:py-8">{props.children}</div>
                </div>
              </div>
            </main>
          </div>
          <BottomNav />
          <Suspense fallback={null}>{props.auth}</Suspense>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
