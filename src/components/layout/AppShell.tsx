"use client";

import { ReactNode } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavigationProvider } from "@/lib/navigation/NavigationContext";
import { DesktopSidebarV2, MobileNavigation, Breadcrumbs } from "./Navigation";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  className?: string;
  showBreadcrumbs?: boolean;
  showSidebarTrigger?: boolean;
  headerContent?: ReactNode;
}

export default function AppShell({
  children,
  className,
  showBreadcrumbs = true,
  showSidebarTrigger = true,
  headerContent,
}: AppShellProps) {
  const isMobile = useIsMobile();

  return (
    <NavigationProvider>
      {isMobile ? (
        // Mobile Layout
        <div className={cn("min-h-screen bg-background", className)}>
          <MobileNavigation />
          <main className="pb-16">
            {" "}
            {/* Account for bottom navigation */}
            {children}
          </main>
        </div>
      ) : (
        // Desktop Layout
        <SidebarProvider>
          <DesktopSidebarV2 />
          <SidebarInset className={className}>
            {(showBreadcrumbs || showSidebarTrigger || headerContent) && (
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                {showSidebarTrigger && <SidebarTrigger className="-ml-1" />}

                <div className="flex items-center gap-2 flex-1">
                  {showBreadcrumbs && <Breadcrumbs />}

                  {headerContent && (
                    <div className="ml-auto">{headerContent}</div>
                  )}
                </div>
              </header>
            )}

            <main className="flex-1">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      )}
    </NavigationProvider>
  );
}
