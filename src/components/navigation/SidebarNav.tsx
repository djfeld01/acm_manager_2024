"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CreditCard,
  BarChart2,
  Users,
  Target,
  Building2,
  ChevronDown,
  ChevronRight,
  LogOut,
  DollarSign,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Facility {
  sitelinkId: string;
  facilityAbbreviation: string;
  facilityName: string;
}

interface SidebarNavProps {
  locations: Facility[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

export function SidebarNav({ locations }: SidebarNavProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Overview: true,
    Operations: true,
    Payroll: true,
    Management: false,
  });
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const depositsChildren = locations.map((loc) => ({
    label: loc.facilityAbbreviation,
    href: `/dailyPaymentsTable/${loc.sitelinkId}`,
  }));

  const payrollChildren = locations.map((loc) => ({
    label: loc.facilityAbbreviation,
    href: `/payroll/${loc.sitelinkId}`,
  }));

  const locationChildren = locations.map((loc) => ({
    label: loc.facilityAbbreviation,
    href: `/location/${loc.sitelinkId}`,
  }));

  const sections: NavSection[] = [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/", icon: LayoutDashboard },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          label: "Location Detail",
          icon: Building2,
          children: locationChildren.length > 0 ? locationChildren : undefined,
          href: locationChildren.length === 0 ? "/location" : undefined,
        },
        {
          label: "Daily Payments",
          icon: CreditCard,
          children: depositsChildren.length > 0 ? depositsChildren : undefined,
          href: depositsChildren.length === 0 ? "/dailyPaymentsTable" : undefined,
        },
        {
          label: "Reconciliation",
          href: "/reconciliation",
          icon: BarChart2,
        },
      ],
    },
    {
      label: "Payroll",
      items: [
        {
          label: "Payroll Summary",
          icon: DollarSign,
          children: payrollChildren.length > 0 ? payrollChildren : undefined,
          href: payrollChildren.length === 0 ? "/payroll" : undefined,
        },
        { label: "Add Bonuses", href: "/payroll/addBonus", icon: PlusCircle },
      ],
    },
    {
      label: "Management",
      items: [
        { label: "Employees", href: "/employees", icon: Users },
        { label: "Goals", href: "/goals", icon: Target },
        { label: "Facilities", href: "/locationConnections", icon: Building2 },
      ],
    },
  ];

  function toggleSection(label: string) {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function toggleItem(label: string) {
    setOpenItems((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
      {sections.map((section) => (
        <div key={section.label} className="mb-1">
          {/* Section header */}
          <button
            onClick={() => toggleSection(section.label)}
            className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{section.label}</span>
            {openSections[section.label] ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {/* Section items */}
          {openSections[section.label] && (
            <div className="mt-0.5 space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const itemOpen = openItems[item.label];

                if (hasChildren) {
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleItem(item.label)}
                        className={cn(
                          "flex items-center justify-between w-full px-2 py-1.5 rounded text-sm transition-colors",
                          item.children?.some((c) => isActive(c.href))
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {itemOpen ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>

                      {itemOpen && (
                        <div className="ml-6 mt-0.5 space-y-0.5">
                          {item.children!.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "block px-2 py-1 rounded text-sm transition-colors",
                                isActive(child.href)
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                      isActive(item.href!)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Sign out */}
      <div className="pt-2 border-t border-border mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
}
