import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import Sidebar from "@/components/navigation/Sidebar";
import PageHeader from "@/components/navigation/PageHeader";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import Providers from "./providers";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { auth } from "@/auth";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ACM Dashboard",
  description: "Dashboard to help facilitate the ACM management company",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/favicon.svg",
    apple: "/images/acm_logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <Providers>
          {isAuthenticated ? (
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <PageHeader />
                <main className="flex-1 overflow-auto">
                  {children}
                </main>
              </div>
            </div>
          ) : (
            <main className="flex min-h-screen items-center justify-center">
              {children}
            </main>
          )}
          <Toaster />
          <Analytics />
          <ReactQueryDevtools initialIsOpen={false} />
        </Providers>
      </body>
    </html>
  );
}
