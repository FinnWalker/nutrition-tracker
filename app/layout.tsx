import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthSessionProvider from "./ui/auth-session-provider";
import SidebarNav from "./ui/sidebar-nav";
import ThemeProvider from "./ui/theme-provider";
import ThemeToggle from "./ui/theme-toggle";
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
            <div className="min-h-dvh md:grid md:grid-cols-[18rem_minmax(0,1fr)]">
              <aside className="hidden border-r border-border bg-surface px-5 py-6 md:flex md:flex-col">
                <SidebarNav />
              </aside>

              <main className="box-border flex min-h-dvh flex-col px-5 py-8 md:px-10 md:py-10">
                <div className="mb-8 flex items-center justify-between gap-4 md:hidden">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-foreground-muted">
                      Wellness
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-tight">
                      Nutrition Tracker
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
                {props.children}
              </main>
            </div>
            {props.auth}
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
