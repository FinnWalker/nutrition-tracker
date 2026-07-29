import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "react-image-crop/dist/ReactCrop.css";
import AuthSessionProvider from "./ui/auth-session-provider";
import SidebarNav from "./ui/sidebar-nav";
import ThemeProvider from "./ui/theme-provider";
import "./globals.css";

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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-background text-foreground">
        <ThemeProvider>
          <AuthSessionProvider>
            <div className="min-h-dvh md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
              <aside className="hidden border-r border-border bg-surface px-5 py-6 md:flex md:flex-col">
                <SidebarNav />
              </aside>

              <main className="flex min-h-dvh flex-col px-4 py-6 md:px-8 md:py-8">
                {props.children}
              </main>
            </div>
            <Suspense fallback={null}>{props.auth}</Suspense>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
