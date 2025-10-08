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

export type LayoutVariant = "default" | "centered" | "full-width" | "split";

interface AppLayoutProps {
  children: ReactNode;
  variant?: LayoutVariant;
  className?: string;
  showBreadcrumbs?: boolean;
  showSidebarTrigger?: boolean;
  headerContent?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

const paddingClasses = {
  none: "",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
};

export default function AppLayout({
  children,
  variant = "default",
  className,
  showBreadcrumbs = true,
  showSidebarTrigger = true,
  headerContent,
  maxWidth = "full",
  padding = "md",
}: AppLayoutProps) {
  const isMobile = useIsMobile();

  const getLayoutClasses = () => {
    const base = "flex-1";
    const paddingClass = paddingClasses[padding];

    switch (variant) {
      case "centered":
        return cn(
          base,
          "container mx-auto",
          maxWidthClasses[maxWidth],
          paddingClass
        );
      case "full-width":
        return cn(base, paddingClass);
      case "split":
        return cn(base, "grid grid-cols-1 lg:grid-cols-2 gap-6", paddingClass);
      default:
        return cn(base, paddingClass);
    }
  };

  return (
    <NavigationProvider>
      {isMobile ? (
        // Mobile Layout
        <div className={cn("min-h-screen bg-background", className)}>
          <MobileNavigation />
          <main className={cn("pb-16", getLayoutClasses())}>{children}</main>
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

            <main className={getLayoutClasses()}>{children}</main>
          </SidebarInset>
        </SidebarProvider>
      )}
    </NavigationProvider>
  );
}
