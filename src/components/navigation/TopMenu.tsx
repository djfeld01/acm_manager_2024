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
import Image from "next/legacy/image";
import { Package2, Menu, Search, CircleUser } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ModeToggle";
import { auth } from "@/auth";
import { db } from "@/db";
import { storageFacilities, usersToFacilities } from "@/db/schema";
import { getFacilityConnections } from "@/lib/controllers/facilityController";
import acmLogo from "@/public/images/acm_logo.svg";
import { SignInButton, SignOutButton } from "@/components/auth/AuthButtons";
export default async function TopMenu() {
  const session = await auth();
  const locations = await getFacilityConnections(
    session?.user?.userDetailId || ""
  );

  return (
    <header className="sticky z-50 top-0 flex h-16 items-center gap-4 border-b bg-background px-4 overflow-hidden md:px-6">
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
        {/* <Link
          href="/locations"
          className="text-foreground transition-colors hover:text-foreground"
        >
          Locations
        </Link> */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="text-muted-foreground hover:text-foreground cursor-pointer">
              Deposits
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {locations.length > 0 ? (
              locations.map((location) => (
                <DropdownMenuItem key={location.sitelinkId}>
                  <Link
                    href={`/dailyPaymentsTable/${location.sitelinkId}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {location.facilityAbbreviation}
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem>
                <DropdownMenuLabel>
                  <SignInButton />
                </DropdownMenuLabel>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="text-muted-foreground hover:text-foreground cursor-pointer">
              Locations
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {locations.length > 0 ? (
              locations.map((location) => (
                <DropdownMenuItem key={location.sitelinkId}>
                  <Link
                    href={`/payroll/${location.sitelinkId}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {location.facilityAbbreviation}
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem>
                <DropdownMenuLabel>
                  <SignInButton />
                </DropdownMenuLabel>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Link
          href="/activity"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Activity
        </Link>

        <Link
          href="/employees"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Employees
        </Link>
        <Link
          href="/goals"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Goals
        </Link>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Deposits
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {locations.length > 0 ? (
                  locations.map((location) => (
                    <DropdownMenuItem key={location.sitelinkId}>
                      <Link
                        href={`/dailyPaymentsTable/${location.sitelinkId}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {location.facilityAbbreviation}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem>
                    <DropdownMenuLabel>
                      <SignInButton />
                    </DropdownMenuLabel>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Locations
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {locations.length > 0 ? (
                  locations.map((location) => (
                    <DropdownMenuItem key={location.sitelinkId}>
                      <Link
                        href={`/payroll/${location.sitelinkId}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {location.facilityAbbreviation}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem>
                    <DropdownMenuLabel>
                      <SignInButton />
                    </DropdownMenuLabel>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/activity"
              className="text-muted-foreground hover:text-foreground"
            >
              Activity
            </Link>{" "}
            <Link
              href="/employees"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Employees
            </Link>
            <Link
              href="/goals"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Goals
            </Link>
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
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
