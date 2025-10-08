"use client";

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
import { useState } from "react";
import { getAriaLabel } from "@/lib/accessibility/aria-utils";
import { ScreenReaderOnly } from "@/lib/accessibility/screen-reader";
import { MIN_TOUCH_TARGET_SIZE } from "@/lib/accessibility/constants";

interface MobileNavigationProps {
  className?: string;
}

export default function MobileNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  if (status === "loading" || !user) {
    return null;
  }

  return (
    <div className={cn("md:hidden", className)}>
      {/* Mobile Header */}
      <header
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
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
            <span className="text-lg font-semibold">ACM Manager</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Hamburger Menu for Secondary Items */}
            {secondaryNavItems.length > 0 && (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={getAriaLabel("MOBILE_MENU")}
                    aria-expanded={isSheetOpen}
                    aria-haspopup="menu"
                  >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                    <ScreenReaderOnly>
                      {isSheetOpen ? "Close menu" : "Open menu"}
                    </ScreenReaderOnly>
                  </Button>
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
                    {secondaryNavItems.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsSheetOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
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
                          <ScreenReaderOnly>(current page)</ScreenReaderOnly>
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
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            )}

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
                </Button>
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
      </header>

      {/* Bottom Tab Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="navigation"
        aria-label={getAriaLabel("MAIN_NAVIGATION")}
      >
        <div
          className="flex h-16 items-center justify-around px-2"
          role="tablist"
        >
          {primaryNavItems.map((item) => {
            const isActive = isActiveItem(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                  `min-h-[${MIN_TOUCH_TARGET_SIZE}px]`, // Ensure minimum touch target
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-hidden="true"
                  />
                  {item.badge && (
                    <Badge
                      variant={item.badge.variant}
                      className="absolute -right-2 -top-2 h-4 min-w-4 px-1 text-[10px] leading-none"
                      aria-label={`${item.badge.text} notifications`}
                    >
                      {item.badge.text}
                    </Badge>
                  )}
                </div>
                <span
                  className={cn(
                    "truncate text-center leading-tight",
                    isActive ? "text-primary" : "text-muted-foreground"
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
      </nav>

      {/* Bottom padding to account for fixed bottom navigation */}
      <div className="h-16" />
    </div>
  );
}
