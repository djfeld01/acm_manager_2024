// Screen reader utilities and components

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Screen reader only text component
 */
export interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function ScreenReaderOnly({
  children,
  className,
}: ScreenReaderOnlyProps) {
  return (
    <span
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "clip-path-inset-50", // Modern browsers
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Live region component for dynamic content announcements
 */
export interface LiveRegionProps {
  children: React.ReactNode;
  priority?: "polite" | "assertive";
  atomic?: boolean;
  relevant?: "additions" | "removals" | "text" | "all" | "additions text";
  className?: string;
}

export function LiveRegion({
  children,
  priority = "polite",
  atomic = false,
  relevant = "additions text",
  className,
}: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  );
}

/**
 * Status announcement component
 */
export interface StatusAnnouncementProps {
  message: string;
  priority?: "polite" | "assertive";
  clearAfter?: number; // milliseconds
}

export function StatusAnnouncement({
  message,
  priority = "polite",
  clearAfter = 5000,
}: StatusAnnouncementProps) {
  const [currentMessage, setCurrentMessage] = React.useState(message);

  React.useEffect(() => {
    setCurrentMessage(message);

    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage("");
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  if (!currentMessage) return null;

  return <LiveRegion priority={priority}>{currentMessage}</LiveRegion>;
}

/**
 * Loading announcement component
 */
export interface LoadingAnnouncementProps {
  isLoading: boolean;
  loadingMessage?: string;
  completedMessage?: string;
  priority?: "polite" | "assertive";
}

export function LoadingAnnouncement({
  isLoading,
  loadingMessage = "Loading content",
  completedMessage = "Content loaded",
  priority = "polite",
}: LoadingAnnouncementProps) {
  const [message, setMessage] = React.useState("");
  const previousLoadingRef = React.useRef(isLoading);

  React.useEffect(() => {
    if (isLoading && !previousLoadingRef.current) {
      // Started loading
      setMessage(loadingMessage);
    } else if (!isLoading && previousLoadingRef.current) {
      // Finished loading
      setMessage(completedMessage);

      // Clear the message after a short delay
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }

    previousLoadingRef.current = isLoading;
  }, [isLoading, loadingMessage, completedMessage]);

  return <LiveRegion priority={priority}>{message}</LiveRegion>;
}

/**
 * Error announcement component
 */
export interface ErrorAnnouncementProps {
  error: string | null;
  priority?: "polite" | "assertive";
  clearAfter?: number;
}

export function ErrorAnnouncement({
  error,
  priority = "assertive",
  clearAfter = 10000,
}: ErrorAnnouncementProps) {
  const [currentError, setCurrentError] = React.useState(error);

  React.useEffect(() => {
    if (error) {
      setCurrentError(error);

      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setCurrentError(null);
        }, clearAfter);

        return () => clearTimeout(timer);
      }
    }
  }, [error, clearAfter]);

  if (!currentError) return null;

  return <LiveRegion priority={priority}>Error: {currentError}</LiveRegion>;
}

/**
 * Progress announcement component
 */
export interface ProgressAnnouncementProps {
  value: number;
  max?: number;
  min?: number;
  label?: string;
  announceEvery?: number; // Announce every N percent
  priority?: "polite" | "assertive";
}

export function ProgressAnnouncement({
  value,
  max = 100,
  min = 0,
  label = "Progress",
  announceEvery = 25,
  priority = "polite",
}: ProgressAnnouncementProps) {
  const [lastAnnounced, setLastAnnounced] = React.useState(-1);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    const percentage = Math.round(((value - min) / (max - min)) * 100);
    const shouldAnnounce =
      Math.floor(percentage / announceEvery) >
      Math.floor(lastAnnounced / announceEvery);

    if (shouldAnnounce || percentage === 100) {
      setMessage(`${label}: ${percentage}% complete`);
      setLastAnnounced(percentage);

      // Clear message after announcement
      const timer = setTimeout(() => setMessage(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [value, max, min, label, announceEvery, lastAnnounced]);

  return <LiveRegion priority={priority}>{message}</LiveRegion>;
}

/**
 * Hook for managing screen reader announcements
 */
export function useScreenReaderAnnouncement() {
  const [announcement, setAnnouncement] = React.useState<{
    message: string;
    priority: "polite" | "assertive";
    id: number;
  } | null>(null);

  const announce = React.useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      setAnnouncement({
        message,
        priority,
        id: Date.now(),
      });
    },
    []
  );

  const clear = React.useCallback(() => {
    setAnnouncement(null);
  }, []);

  return {
    announce,
    clear,
    announcement: announcement ? (
      <LiveRegion key={announcement.id} priority={announcement.priority}>
        {announcement.message}
      </LiveRegion>
    ) : null,
  };
}

/**
 * Utility to create descriptive text for complex UI elements
 */
export function createDescription(
  parts: (string | undefined | null)[]
): string {
  return parts.filter(Boolean).join(", ");
}

/**
 * Utility to format numbers for screen readers
 */
export function formatNumberForScreenReader(
  value: number,
  options: {
    type?: "currency" | "percentage" | "decimal";
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const { type = "decimal", currency = "USD" } = options;

  switch (type) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        ...options,
      }).format(value);

    case "percentage":
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        ...options,
      }).format(value / 100);

    default:
      return new Intl.NumberFormat("en-US", options).format(value);
  }
}

/**
 * Utility to format dates for screen readers
 */
export function formatDateForScreenReader(
  date: Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat("en-US", defaultOptions).format(date);
}
