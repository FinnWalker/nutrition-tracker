import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SidebarNav from "./ui/sidebar-nav";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <div className="min-h-screen md:grid md:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="hidden border-r border-[var(--border)] bg-[var(--panel)] px-5 py-6 md:flex md:flex-col">
            <SidebarNav />
          </aside>

          <main className="min-h-screen px-5 py-8 md:px-10 md:py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
