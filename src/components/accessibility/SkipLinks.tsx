"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getAriaLabel } from "@/lib/accessibility/aria-utils";

export interface SkipLink {
  href: string;
  label: string;
  id?: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const DEFAULT_SKIP_LINKS: SkipLink[] = [
  { href: "#main-content", label: "Skip to main content" },
  { href: "#navigation", label: "Skip to navigation" },
  { href: "#footer", label: "Skip to footer" },
];

export function SkipLinks({
  links = DEFAULT_SKIP_LINKS,
  className,
}: SkipLinksProps) {
  const handleSkipLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    event.preventDefault();

    const targetId = href.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      // Make the target focusable if it isn't already
      const originalTabIndex = targetElement.getAttribute("tabindex");
      if (
        !targetElement.matches("a, button, input, select, textarea, [tabindex]")
      ) {
        targetElement.setAttribute("tabindex", "-1");
      }

      // Focus the target element
      targetElement.focus();

      // Scroll to the target element
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Remove temporary tabindex after focus
      if (
        originalTabIndex === null &&
        targetElement.getAttribute("tabindex") === "-1"
      ) {
        targetElement.removeAttribute("tabindex");
      }

      // Announce to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = `Skipped to ${
        targetElement.getAttribute("aria-label") ||
        targetElement.textContent ||
        "content"
      }`;

      document.body.appendChild(announcement);
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    }
  };

  return (
    <div
      className={cn("skip-links", className)}
      role="navigation"
      aria-label="Skip links"
    >
      {links.map((link, index) => (
        <a
          key={link.id || `skip-${index}`}
          href={link.href}
          className={cn(
            // Hidden by default
            "absolute left-[-9999px] top-auto w-px h-px overflow-hidden",
            // Visible when focused
            "focus:left-4 focus:top-4 focus:w-auto focus:h-auto focus:overflow-visible",
            // Styling when visible
            "focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground",
            "focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            // Typography
            "text-sm font-medium",
            // Transitions
            "transition-all duration-150 ease-in-out"
          )}
          onClick={(e) => handleSkipLinkClick(e, link.href)}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

interface LandmarkSkipLinksProps {
  className?: string;
}

export function LandmarkSkipLinks({ className }: LandmarkSkipLinksProps) {
  const [availableLandmarks, setAvailableLandmarks] = React.useState<
    SkipLink[]
  >([]);

  React.useEffect(() => {
    // Check which landmarks are available on the page
    const landmarks: SkipLink[] = [];

    // Check for main content
    const mainContent = document.querySelector(
      '#main-content, main, [role="main"]'
    );
    if (mainContent) {
      landmarks.push({
        href: `#${mainContent.id || "main-content"}`,
        label: "Skip to main content",
      });
    }

    // Check for navigation
    const navigation = document.querySelector(
      '#navigation, nav, [role="navigation"]'
    );
    if (navigation) {
      landmarks.push({
        href: `#${navigation.id || "navigation"}`,
        label: "Skip to navigation",
      });
    }

    // Check for search
    const search = document.querySelector('#search, [role="search"]');
    if (search) {
      landmarks.push({
        href: `#${search.id || "search"}`,
        label: "Skip to search",
      });
    }

    // Check for complementary content (sidebar)
    const complementary = document.querySelector(
      '[role="complementary"], aside'
    );
    if (complementary) {
      landmarks.push({
        href: `#${complementary.id || "sidebar"}`,
        label: "Skip to sidebar",
      });
    }

    // Check for footer
    const footer = document.querySelector(
      '#footer, footer, [role="contentinfo"]'
    );
    if (footer) {
      landmarks.push({
        href: `#${footer.id || "footer"}`,
        label: "Skip to footer",
      });
    }

    setAvailableLandmarks(landmarks);
  }, []);

  if (availableLandmarks.length === 0) {
    return null;
  }

  return <SkipLinks links={availableLandmarks} className={className} />;
}

interface PageSkipLinksProps {
  customLinks?: SkipLink[];
  includeDefaults?: boolean;
  className?: string;
}

export function PageSkipLinks({
  customLinks = [],
  includeDefaults = true,
  className,
}: PageSkipLinksProps) {
  const links = includeDefaults
    ? [...DEFAULT_SKIP_LINKS, ...customLinks]
    : customLinks;

  return <SkipLinks links={links} className={className} />;
}

// Hook for managing skip links dynamically
export function useSkipLinks() {
  const [skipLinks, setSkipLinks] = React.useState<SkipLink[]>([]);

  const addSkipLink = React.useCallback((link: SkipLink) => {
    setSkipLinks((prev) => {
      // Avoid duplicates
      if (prev.some((existing) => existing.href === link.href)) {
        return prev;
      }
      return [...prev, link];
    });
  }, []);

  const removeSkipLink = React.useCallback((href: string) => {
    setSkipLinks((prev) => prev.filter((link) => link.href !== href));
  }, []);

  const clearSkipLinks = React.useCallback(() => {
    setSkipLinks([]);
  }, []);

  return {
    skipLinks,
    addSkipLink,
    removeSkipLink,
    clearSkipLinks,
  };
}
