"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigation } from "@/lib/navigation/NavigationContext";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  className?: string;
  maxItems?: number;
}

export default function Breadcrumbs({
  className,
  maxItems = 3,
}: BreadcrumbsProps) {
  const { breadcrumbs } = useNavigation();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if we're just on dashboard
  }

  // Handle truncation if we have too many items
  const shouldTruncate = breadcrumbs.length > maxItems;
  const displayItems = shouldTruncate
    ? [
        breadcrumbs[0], // Always show first (Dashboard)
        ...breadcrumbs.slice(-(maxItems - 1)), // Show last few items
      ]
    : breadcrumbs;

  return (
    <Breadcrumb className={cn("", className)}>
      <BreadcrumbList>
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isFirst = index === 0;

          return (
            <div key={item.href} className="flex items-center">
              {/* Show ellipsis if we truncated and this is not the first item */}
              {shouldTruncate &&
                index === 1 &&
                breadcrumbs.length > maxItems && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbEllipsis />
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  </>
                )}

              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-medium">
                    {isFirst && <Home className="h-4 w-4 mr-1 inline" />}
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      {isFirst && <Home className="h-4 w-4 mr-1" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {/* Show separator if not last item */}
              {!isLast && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
