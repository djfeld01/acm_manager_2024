import { auth } from "@/auth";
import { getFacilityConnections } from "@/lib/controllers/facilityController";
import { MobileSidebar } from "./MobileSidebar";
import Image from "next/legacy/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CircleUser } from "lucide-react";
import { SignOutButton } from "@/components/auth/AuthButtons";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function PageHeader() {
  const session = await auth();
  const locations = session?.user?.userDetailId
    ? await getFacilityConnections(session.user.userDetailId)
    : [];

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background px-4">
      {/* Mobile hamburger — only visible on small screens */}
      <MobileSidebar locations={locations} />

      {/* Spacer — breadcrumb can be added here later */}
      <div className="flex-1" />

      <ThemeToggle />

      {/* User menu */}
      {session?.user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  objectFit="cover"
                  width={32}
                  height={32}
                  className="rounded-full"
                  priority
                />
              ) : (
                <CircleUser className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{session.user.name}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {session.user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <SignOutButton className="w-full justify-start cursor-pointer" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </header>
  );
}
