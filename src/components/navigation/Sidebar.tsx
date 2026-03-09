import Link from "next/link";
import Image from "next/legacy/image";
import { auth } from "@/auth";
import { getFacilityConnections } from "@/lib/controllers/facilityController";
import { SidebarNav } from "./SidebarNav";

export default async function Sidebar() {
  const session = await auth();
  if (!session?.user) return null;

  const locations = await getFacilityConnections(
    session.user.userDetailId || ""
  );

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-sidebar-background h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-7 w-28 shrink-0">
            <Image
              alt="ACM Logo"
              src="/images/acm_logo.svg"
              layout="fill"
              objectFit="contain"
              priority
              className="dark:invert"
            />
          </div>
          <span className="sr-only">ACM Dashboard</span>
        </Link>
      </div>

      {/* Navigation — client component handles active state */}
      <SidebarNav locations={locations} userRole={session.user.role ?? ""} />

      {/* User footer */}
      <div className="mt-auto border-t border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={28}
              height={28}
              className="rounded-full shrink-0"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-primary">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {session.user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
