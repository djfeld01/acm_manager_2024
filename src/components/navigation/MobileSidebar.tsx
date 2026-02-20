"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./SidebarNav";
import Image from "next/legacy/image";
import Link from "next/link";

interface Facility {
  sitelinkId: string;
  facilityAbbreviation: string;
  facilityName: string;
}

interface MobileSidebarProps {
  locations: Facility[];
}

export function MobileSidebar({ locations }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-56 p-0 flex flex-col">
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-border shrink-0">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
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
        <SidebarNav locations={locations} />
      </SheetContent>
    </Sheet>
  );
}
