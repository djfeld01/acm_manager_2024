"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createAriaNavigationProps,
  createAriaExpandableProps,
  getAriaLabel,
} from "@/lib/accessibility/aria-utils";
import {
  useKeyboardNavigation,
  useRovingTabIndex,
} from "@/lib/accessibility/keyboard-navigation";
import { ScreenReaderOnly } from "@/lib/accessibility/screen-reader";

export interface AccessibleNavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  children?: AccessibleNavigationItem[];
  level?: number;
}

interface AccessibleNavigationProps {
  items: AccessibleNavigationItem[];
  orientation?: "horizontal" | "vertical";
  className?: string;
  ariaLabel?: string;
  onItemSelect?: (item: AccessibleNavigationItem) => void;
}

export function AccessibleNavigation({
  items,
  orientation = "vertical",
  className,
  ariaLabel,
  onItemSelect,
}: AccessibleNavigationProps) {
  const pathname = usePathname();
  const { containerRef } = useRovingTabIndex<HTMLElement>({
    orientation,
    itemSelector: '[role="menuitem"]',
  });

  const isActiveItem = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleItemClick = (item: AccessibleNavigationItem) => {
    onItemSelect?.(item);
  };

  const renderNavigationItem = (
    item: AccessibleNavigationItem,
    index: number
  ) => {
    const isActive = isActiveItem(item.href);
    const Icon = item.icon;
    const level = item.level || 1;

    return (
      <li key={item.id} role="none">
        <Link
          href={item.href}
          role="menuitem"
          tabIndex={index === 0 ? 0 : -1}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "hover:bg-accent hover:text-accent-foreground",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground",
            className
          )}
          onClick={() => handleItemClick(item)}
          {...createAriaNavigationProps({
            current: isActive ? "page" : false,
            level,
          })}
        >
          {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
          <span>{item.label}</span>
          {isActive && <ScreenReaderOnly>(current page)</ScreenReaderOnly>}
          {item.badge && (
            <span
              className={cn(
                "ml-auto rounded-full px-2 py-1 text-xs",
                item.badge.variant === "destructive" &&
                  "bg-destructive text-destructive-foreground",
                item.badge.variant === "secondary" &&
                  "bg-secondary text-secondary-foreground",
                item.badge.variant === "outline" && "border border-border",
                !item.badge.variant && "bg-primary text-primary-foreground"
              )}
              aria-label={`${item.badge.text} notifications`}
            >
              {item.badge.text}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <nav
      ref={containerRef}
      aria-label={ariaLabel || getAriaLabel("MAIN_NAVIGATION")}
      className={className}
    >
      <ul role="menu" className="space-y-1">
        {items.map((item, index) => renderNavigationItem(item, index))}
      </ul>
    </nav>
  );
}

interface AccessibleExpandableNavigationProps
  extends AccessibleNavigationProps {
  expandedItems?: string[];
  onToggleExpanded?: (itemId: string) => void;
}

export function AccessibleExpandableNavigation({
  items,
  expandedItems = [],
  onToggleExpanded,
  orientation = "vertical",
  className,
  ariaLabel,
  onItemSelect,
}: AccessibleExpandableNavigationProps) {
  const pathname = usePathname();
  const { containerRef } = useKeyboardNavigation<HTMLElement>({
    isOpen: true,
    itemSelector: '[role="menuitem"], [role="button"]',
    orientation,
  });

  const isActiveItem = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const isExpanded = (itemId: string) => expandedItems.includes(itemId);

  const handleToggleExpanded = (itemId: string) => {
    onToggleExpanded?.(itemId);
  };

  const handleItemClick = (item: AccessibleNavigationItem) => {
    onItemSelect?.(item);
  };

  const renderNavigationItem = (
    item: AccessibleNavigationItem,
    level: number = 1
  ) => {
    const isActive = isActiveItem(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const expanded = isExpanded(item.id);
    const Icon = item.icon;
    const childrenId = `${item.id}-children`;

    return (
      <li key={item.id} role="none">
        <div className="flex items-center">
          <Link
            href={item.href}
            role="menuitem"
            className={cn(
              "flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
              level > 1 && "ml-4"
            )}
            onClick={() => handleItemClick(item)}
            {...createAriaNavigationProps({
              current: isActive ? "page" : false,
              level,
            })}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            <span>{item.label}</span>
            {isActive && <ScreenReaderOnly>(current page)</ScreenReaderOnly>}
            {item.badge && (
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-1 text-xs",
                  item.badge.variant === "destructive" &&
                    "bg-destructive text-destructive-foreground",
                  item.badge.variant === "secondary" &&
                    "bg-secondary text-secondary-foreground",
                  item.badge.variant === "outline" && "border border-border",
                  !item.badge.variant && "bg-primary text-primary-foreground"
                )}
                aria-label={`${item.badge.text} notifications`}
              >
                {item.badge.text}
              </span>
            )}
          </Link>

          {hasChildren && (
            <button
              type="button"
              role="button"
              className={cn(
                "p-2 rounded-md transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => handleToggleExpanded(item.id)}
              {...createAriaExpandableProps({
                expanded,
                controls: childrenId,
                label: `${expanded ? "Collapse" : "Expand"} ${
                  item.label
                } submenu`,
              })}
            >
              <svg
                className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-90"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <ScreenReaderOnly>
                {expanded ? "Collapse" : "Expand"} {item.label} submenu
              </ScreenReaderOnly>
            </button>
          )}
        </div>

        {hasChildren && (
          <ul
            id={childrenId}
            role="menu"
            className={cn(
              "mt-1 space-y-1 overflow-hidden transition-all duration-200",
              expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
            aria-hidden={!expanded}
          >
            {expanded &&
              item.children!.map((child) =>
                renderNavigationItem({ ...child, level: level + 1 }, level + 1)
              )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav
      ref={containerRef}
      aria-label={ariaLabel || getAriaLabel("MAIN_NAVIGATION")}
      className={className}
    >
      <ul role="menu" className="space-y-1">
        {items.map((item) => renderNavigationItem(item))}
      </ul>
    </nav>
  );
}
