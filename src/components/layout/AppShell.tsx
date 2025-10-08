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
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { getAriaLabel } from "@/lib/accessibility/aria-utils";

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
      {/* Skip Links for keyboard navigation */}
      <SkipLinks
        links={[
          { href: "#main-content", label: "Skip to main content" },
          { href: "#navigation", label: "Skip to navigation" },
        ]}
      />

      {isMobile ? (
        // Mobile Layout
        <div className={cn("min-h-screen bg-background", className)}>
          <div id="navigation">
            <MobileNavigation />
          </div>
          <main
            id="main-content"
            className="pb-16"
            role="main"
            aria-label="Main content"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      ) : (
        // Desktop Layout
        <SidebarProvider>
          <div id="navigation">
            <DesktopSidebarV2 />
          </div>
          <SidebarInset className={className}>
            {(showBreadcrumbs || showSidebarTrigger || headerContent) && (
              <header
                className="flex h-16 shrink-0 items-center gap-2 border-b px-4"
                role="banner"
              >
                {showSidebarTrigger && (
                  <SidebarTrigger
                    className="-ml-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={getAriaLabel("SIDEBAR_TOGGLE")}
                  />
                )}

                <div className="flex items-center gap-2 flex-1">
                  {showBreadcrumbs && (
                    <nav aria-label={getAriaLabel("BREADCRUMB_NAVIGATION")}>
                      <Breadcrumbs />
                    </nav>
                  )}

                  {headerContent && (
                    <div className="ml-auto">{headerContent}</div>
                  )}
                </div>
              </header>
            )}

            <main
              id="main-content"
              className="flex-1"
              role="main"
              aria-label="Main content"
              tabIndex={-1}
            >
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      )}
    </NavigationProvider>
  );
}
