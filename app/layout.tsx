import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "react-image-crop/dist/ReactCrop.css";
import AuthSessionProvider from "./ui/auth-session-provider";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-background text-foreground">
        <AuthSessionProvider>
          {props.children}
          <Suspense fallback={null}>{props.auth}</Suspense>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
