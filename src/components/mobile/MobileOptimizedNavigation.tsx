"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, User, LogOut } from "lucide-react";
import { Role } from "@/db/schema/user";
import { filterByRole } from "@/lib/permissions";
import {
  NAVIGATION_ITEMS,
  SECONDARY_NAVIGATION_ITEMS,
} from "@/lib/navigation/config";
import { signOut } from "next-auth/react";
import { getAriaLabel } from "@/lib/accessibility/aria-utils";
import { ScreenReaderOnly } from "@/lib/accessibility/screen-reader";
import { MIN_TOUCH_TARGET_SIZE } from "@/lib/accessibility/constants";
import {
  useDeviceInfo,
  useSafeAreaInsets,
} from "@/lib/mobile/device-detection";
import { useSwipeGesture } from "@/lib/mobile/gestures";
import { useTouchEnhancement, hapticFeedback } from "@/lib/mobile/touch";
import { SlideIn, FadeIn } from "./MobileAnimations";
import { TouchFriendlyButton } from "./TouchFriendlyButton";
import { OfflineIndicator, NetworkQualityIndicator } from "./OfflineIndicator";

interface MobileOptimizedNavigationProps {
  className?: string;
}

export default function MobileOptimizedNavigation({
  className,
}: MobileOptimizedNavigationProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { isTouchDevice, isIOS, isAndroid } = useDeviceInfo();
  const safeAreaInsets = useSafeAreaInsets();

  // Convert session user to our User type
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || null,
        email: session.user.email!,
        role: session.user.role as Role,
        image: session.user.image || null,
        userDetailId: session.user.userDetailId || null,
        facilities: (session.user.facilities || []).map((f) => ({
          id: f.sitelinkId,
          sitelinkId: f.sitelinkId,
          facilityName: f.facilityName,
          facilityAbbreviation: f.facilityAbbreviation,
        })),
      }
    : null;

  // Filter navigation items based on user role
  const allNavItems = user
    ? filterByRole(
        [...NAVIGATION_ITEMS, ...SECONDARY_NAVIGATION_ITEMS],
        user.role
      )
    : [];

  // Get primary navigation items for bottom tabs (limit to 4 for mobile)
  const primaryNavItems = allNavItems.slice(0, 4);

  // Get remaining items for hamburger menu
  const secondaryNavItems = allNavItems.slice(4);

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if a navigation item is active
  const isActiveItem = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  // Handle tab swipe gestures
  const handleTabSwipe = (direction: "left" | "right") => {
    if (direction === "left" && activeTab < primaryNavItems.length - 1) {
      setActiveTab(activeTab + 1);
      hapticFeedback("light");
    } else if (direction === "right" && activeTab > 0) {
      setActiveTab(activeTab - 1);
      hapticFeedback("light");
    }
  };

  const swipeRef = useSwipeGesture<HTMLDivElement>(
    (gesture) => {
      if (gesture.direction === "left" || gesture.direction === "right") {
        handleTabSwipe(gesture.direction);
      }
    },
    {
      swipeThreshold: 50,
      swipeVelocityThreshold: 0.3,
    }
  );

  const menuButtonRef = useTouchEnhancement<HTMLButtonElement>({
    minSize: MIN_TOUCH_TARGET_SIZE,
    feedback: { haptic: true, visual: true },
  });

  if (status === "loading" || !user) {
    return null;
  }

  return (
    <div className={cn("md:hidden", className)}>
      {/* Mobile Header */}
      <SlideIn direction="down" duration={300}>
        <header
          className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          role="banner"
          style={{
            paddingTop: safeAreaInsets.top,
            paddingLeft: safeAreaInsets.left,
            paddingRight: safeAreaInsets.right,
          }}
        >
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                role="img"
                aria-label="ACM Manager logo"
              >
                ACM
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold">ACM Manager</span>
                <div className="flex items-center gap-2">
                  <NetworkQualityIndicator />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Hamburger Menu for Secondary Items */}
              {secondaryNavItems.length > 0 && (
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <TouchFriendlyButton
                      ref={menuButtonRef}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      aria-label={getAriaLabel("MOBILE_MENU")}
                      aria-expanded={isSheetOpen}
                      aria-haspopup="menu"
                    >
                      <Menu className="h-5 w-5" aria-hidden="true" />
                      <ScreenReaderOnly>
                        {isSheetOpen ? "Close menu" : "Open menu"}
                      </ScreenReaderOnly>
                    </TouchFriendlyButton>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-80"
                    role="dialog"
                    aria-labelledby="mobile-menu-title"
                    aria-describedby="mobile-menu-description"
                  >
                    <SheetHeader>
                      <SheetTitle id="mobile-menu-title">Menu</SheetTitle>
                      <SheetDescription id="mobile-menu-description">
                        Additional navigation options
                      </SheetDescription>
                    </SheetHeader>
                    <nav
                      className="mt-6 space-y-1"
                      role="navigation"
                      aria-label={getAriaLabel("SECONDARY_NAVIGATION")}
                    >
                      {secondaryNavItems.map((item, index) => (
                        <FadeIn key={item.id} delay={index * 50}>
                          <Link
                            href={item.href}
                            onClick={() => setIsSheetOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                              "min-h-[44px]", // Touch-friendly height
                              isActiveItem(item.href)
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                            role="menuitem"
                            aria-current={
                              isActiveItem(item.href) ? "page" : undefined
                            }
                          >
                            <item.icon className="h-5 w-5" aria-hidden="true" />
                            <span>{item.label}</span>
                            {isActiveItem(item.href) && (
                              <ScreenReaderOnly>
                                (current page)
                              </ScreenReaderOnly>
                            )}
                            {item.badge && (
                              <Badge
                                variant={item.badge.variant}
                                className="ml-auto h-5 px-1.5 text-xs"
                                aria-label={`${item.badge.text} notifications`}
                              >
                                {item.badge.text}
                              </Badge>
                            )}
                          </Link>
                        </FadeIn>
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>
              )}

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <TouchFriendlyButton
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                    aria-label={getAriaLabel("USER_MENU")}
                    aria-haspopup="menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.image || undefined}
                        alt={user.name || "User"}
                      />
                      <AvatarFallback>
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TouchFriendlyButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  align="end"
                  forceMount
                  role="menu"
                  aria-label="User account menu"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      role="menuitem"
                    >
                      <User className="mr-2 h-4 w-4" aria-hidden="true" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    role="menuitem"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Offline Indicator */}
          <div className="px-4 pb-2">
            <OfflineIndicator />
          </div>
        </header>
      </SlideIn>

      {/* Bottom Tab Navigation */}
      <SlideIn direction="up" duration={300} delay={100}>
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          role="navigation"
          aria-label={getAriaLabel("MAIN_NAVIGATION")}
          style={{
            paddingBottom: safeAreaInsets.bottom,
            paddingLeft: safeAreaInsets.left,
            paddingRight: safeAreaInsets.right,
          }}
        >
          <div
            ref={swipeRef}
            className="flex h-16 items-center justify-around px-2"
            role="tablist"
          >
            {primaryNavItems.map((item, index) => {
              const isActive = isActiveItem(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200",
                    `min-h-[${MIN_TOUCH_TARGET_SIZE}px]`, // Ensure minimum touch target
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "touch-manipulation select-none", // Touch optimizations
                    isActive
                      ? "text-primary scale-105"
                      : "text-muted-foreground hover:text-foreground active:scale-95"
                  )}
                  onClick={() => {
                    setActiveTab(index);
                    if (isTouchDevice) {
                      hapticFeedback("light");
                    }
                  }}
                >
                  <div className="relative">
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-all duration-200",
                        isActive
                          ? "text-primary scale-110"
                          : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    {item.badge && (
                      <Badge
                        variant={item.badge.variant}
                        className="absolute -right-2 -top-2 h-4 min-w-4 px-1 text-[10px] leading-none animate-pulse"
                        aria-label={`${item.badge.text} notifications`}
                      >
                        {item.badge.text}
                      </Badge>
                    )}
                  </div>
                  <span
                    className={cn(
                      "truncate text-center leading-tight transition-all duration-200",
                      isActive
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <ScreenReaderOnly>(current page)</ScreenReaderOnly>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Tab indicator */}
          <div
            className="absolute top-0 h-0.5 bg-primary transition-all duration-300 ease-out"
            style={{
              left: `${(activeTab / primaryNavItems.length) * 100}%`,
              width: `${100 / primaryNavItems.length}%`,
            }}
          />
        </nav>
      </SlideIn>

      {/* Bottom padding to account for fixed bottom navigation */}
      <div className="h-16" style={{ paddingBottom: safeAreaInsets.bottom }} />
    </div>
  );
}
