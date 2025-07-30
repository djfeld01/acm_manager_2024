import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SheetTrigger, SheetContent, Sheet } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Image from "next/legacy/image";
import { Menu, CircleUser, ChevronDown } from "lucide-react";
import { auth } from "@/auth";
import { getFacilityConnections } from "@/lib/controllers/facilityController";
import { getNavigationForUser, NavigationItem } from "@/lib/navigation";
import acmLogo from "@/public/images/acm_logo.svg";
import { SignInButton, SignOutButton } from "@/components/auth/AuthButtons";
export default async function TopMenu() {
  const session = await auth();
  const locations = await getFacilityConnections(
    session?.user?.userDetailId || ""
  );

  // Get user role and navigation items
  const userRole = session?.user?.role || "USER";
  const hasLocations = locations.length > 0;
  const navigationSections = getNavigationForUser(userRole, hasLocations);

  // Helper function to render location-specific items
  const renderLocationItems = (item: NavigationItem) => {
    if (!item.requiresLocations || !hasLocations) {
      return (
        <DropdownMenuItem key={item.id}>
          <Link
            href={item.href}
            className="text-muted-foreground hover:text-foreground"
          >
            {item.label}
          </Link>
        </DropdownMenuItem>
      );
    }

    // For location-specific items, show dropdown with locations
    const baseRoute = item.href
      .replace("/payroll", "")
      .replace("/deposits", "");
    return locations.map((location) => (
      <DropdownMenuItem key={`${item.id}-${location.sitelinkId}`}>
        <Link
          href={`${item.href}/${location.sitelinkId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          {location.facilityAbbreviation} - {item.label}
        </Link>
      </DropdownMenuItem>
    ));
  };

  return (
    <header className="sticky z-50 top-0 flex h-16 items-center gap-4 border-b bg-background px-4 overflow-hidden md:px-6">
      {/* Desktop Navigation */}
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Image
            alt="Advantage Consulting & Management Logo"
            src={acmLogo}
            height={150}
          />
          <span className="sr-only">ACM Dashboard</span>
        </Link>

        {/* Role-based Navigation Items */}
        {navigationSections.map((section) =>
          section.items.map((item) => {
            // Handle location-specific dropdowns
            if (item.requiresLocations && hasLocations) {
              return (
                <DropdownMenu key={item.id}>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuLabel>
                      {item.label} by Location
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {locations.map((location) => (
                      <DropdownMenuItem key={location.sitelinkId}>
                        <Link
                          href={`${item.href}/${location.sitelinkId}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {location.facilityAbbreviation}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            // Regular navigation items
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.badge && (
                  <Badge variant="secondary" className="ml-1">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })
        )}

        {/* Show sign-in prompt if no access */}
        {!session?.user && (
          <div className="text-muted-foreground">
            <SignInButton />
          </div>
        )}
      </nav>
      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden touch-target"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Image
                alt="Advantage Consulting & Management Logo"
                src={acmLogo}
                height={150}
              />
              <span className="sr-only">ACM Dashboard</span>
            </Link>

            {/* Role-based Mobile Navigation */}
            {navigationSections.map((section) => (
              <div key={section.id} className="space-y-3">
                {section.items.length > 1 && (
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {section.label}
                  </div>
                )}

                {section.items.map((item) => (
                  <div key={item.id}>
                    {/* Location-specific items */}
                    {item.requiresLocations && hasLocations ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-base font-medium">
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </div>
                        <div className="ml-7 space-y-1">
                          {locations.map((location) => (
                            <Link
                              key={location.sitelinkId}
                              href={`${item.href}/${location.sitelinkId}`}
                              className="block text-sm text-muted-foreground hover:text-foreground py-1"
                            >
                              {location.facilityAbbreviation}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Regular navigation items */
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
                      >
                        <item.icon className="h-5 w-5" />
                        <div className="flex-1">
                          <div>{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                        {item.badge && (
                          <Badge variant="secondary">{item.badge}</Badge>
                        )}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* User Info Section */}
            {session?.user && (
              <div className="mt-8 pt-6 border-t space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt="User Avatar"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <CircleUser className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{session.user.name}</div>
                    <div className="text-muted-foreground">{userRole}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Sign-in prompt if no access */}
            {!session?.user && (
              <div className="mt-8 pt-6 border-t">
                <SignInButton />
              </div>
            )}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          {/* <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div> */}
        </form>
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full ">
                <Image
                  src={session.user?.image || ""}
                  alt="Logged In User Avatar"
                  objectFit="cover"
                  width={100}
                  height={100}
                  className="rounded-full"
                  priority={true}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>
                  <div>{session.user.name}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {userRole} • {locations.length} location
                    {locations.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <SignOutButton />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <SignInButton />
              </DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* <ModeToggle /> */}
      </div>
    </header>
  );
}
