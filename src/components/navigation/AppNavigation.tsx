"use client";

import React from "react";
import { useSession } from "next-auth/react";
import DesktopNavigation from "./DesktopNavigation";
import MobileNavigation from "./MobileNavigation";
import { NavigationProvider } from "./NavigationContext";

export default function AppNavigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <NavigationProvider session={session}>
      <div className="min-h-screen bg-background">
        {/* Desktop Navigation - Sidebar */}
        <div className="hidden md:block">
          <DesktopNavigation />
        </div>

        {/* Main Content Area */}
        <div className="md:pl-64">
          <main className="min-h-screen pb-16 md:pb-0">{children}</main>
        </div>

        {/* Mobile Navigation - Bottom Tabs */}
        <div className="md:hidden">
          <MobileNavigation />
        </div>
      </div>
    </NavigationProvider>
  );
}
