// Focus management utilities and hooks

import { useEffect, useRef, useCallback } from "react";
import { FOCUS_SELECTORS } from "./constants";

/**
 * Hook for managing focus restoration
 */
export function useFocusRestore() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (
      previousFocusRef.current &&
      document.contains(previousFocusRef.current)
    ) {
      previousFocusRef.current.focus();
    }
  }, []);

  return { saveFocus, restoreFocus };
}

/**
 * Hook for auto-focusing elements
 */
export function useAutoFocus<T extends HTMLElement>(
  shouldFocus: boolean = true,
  delay: number = 0
) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      const focusElement = () => {
        elementRef.current?.focus();
      };

      if (delay > 0) {
        const timer = setTimeout(focusElement, delay);
        return () => clearTimeout(timer);
      } else {
        focusElement();
      }
    }
  }, [shouldFocus, delay]);

  return elementRef;
}

/**
 * Hook for managing focus within a container
 */
export function useFocusWithin<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const hasFocusWithinRef = useRef(false);

  const handleFocusIn = useCallback(() => {
    hasFocusWithinRef.current = true;
  }, []);

  const handleFocusOut = useCallback((event: FocusEvent) => {
    const container = containerRef.current;
    if (!container) return;

    // Check if the new focus target is still within the container
    const newFocusTarget = event.relatedTarget as HTMLElement;
    if (!newFocusTarget || !container.contains(newFocusTarget)) {
      hasFocusWithinRef.current = false;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("focusin", handleFocusIn);
    container.addEventListener("focusout", handleFocusOut);

    return () => {
      container.removeEventListener("focusin", handleFocusIn);
      container.removeEventListener("focusout", handleFocusOut);
    };
  }, [handleFocusIn, handleFocusOut]);

  return {
    containerRef,
    hasFocusWithin: () => hasFocusWithinRef.current,
  };
}

/**
 * Hook for skip links functionality
 */
export function useSkipLinks() {
  const skipLinksRef = useRef<HTMLDivElement>(null);

  const addSkipLink = useCallback((targetId: string, label: string) => {
    if (!skipLinksRef.current) return;

    const existingLink = skipLinksRef.current.querySelector(
      `[href="#${targetId}"]`
    );
    if (existingLink) return; // Skip link already exists

    const skipLink = document.createElement("a");
    skipLink.href = `#${targetId}`;
    skipLink.textContent = label;
    skipLink.className =
      "skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg";

    skipLink.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    skipLinksRef.current.appendChild(skipLink);
  }, []);

  const removeSkipLink = useCallback((targetId: string) => {
    if (!skipLinksRef.current) return;

    const skipLink = skipLinksRef.current.querySelector(
      `[href="#${targetId}"]`
    );
    if (skipLink) {
      skipLinksRef.current.removeChild(skipLink);
    }
  }, []);

  return {
    skipLinksRef,
    addSkipLink,
    removeSkipLink,
  };
}

/**
 * Utility to find all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll(FOCUS_SELECTORS.FOCUSABLE_ELEMENTS)
  ).filter((element) => {
    const htmlElement = element as HTMLElement;
    return (
      htmlElement.offsetWidth > 0 &&
      htmlElement.offsetHeight > 0 &&
      !htmlElement.hasAttribute("disabled") &&
      htmlElement.getAttribute("aria-hidden") !== "true"
    );
  }) as HTMLElement[];
}

/**
 * Utility to focus the first focusable element in a container
 */
export function focusFirstElement(container: HTMLElement): boolean {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
    return true;
  }
  return false;
}

/**
 * Utility to focus the last focusable element in a container
 */
export function focusLastElement(container: HTMLElement): boolean {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[focusableElements.length - 1].focus();
    return true;
  }
  return false;
}

/**
 * Utility to create a focus guard element
 */
export function createFocusGuard(): HTMLElement {
  const guard = document.createElement("div");
  guard.tabIndex = 0;
  guard.style.position = "fixed";
  guard.style.left = "-9999px";
  guard.style.width = "1px";
  guard.style.height = "1px";
  guard.style.opacity = "0";
  guard.setAttribute("aria-hidden", "true");
  return guard;
}

/**
 * Hook for managing focus guards around modals/dialogs
 */
export function useFocusGuards<T extends HTMLElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);
  const beforeGuardRef = useRef<HTMLElement | null>(null);
  const afterGuardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Create focus guards
    const beforeGuard = createFocusGuard();
    const afterGuard = createFocusGuard();

    beforeGuardRef.current = beforeGuard;
    afterGuardRef.current = afterGuard;

    // Insert guards
    container.parentNode?.insertBefore(beforeGuard, container);
    container.parentNode?.insertBefore(afterGuard, container.nextSibling);

    // Handle focus on guards
    const handleBeforeGuardFocus = () => {
      focusLastElement(container);
    };

    const handleAfterGuardFocus = () => {
      focusFirstElement(container);
    };

    beforeGuard.addEventListener("focus", handleBeforeGuardFocus);
    afterGuard.addEventListener("focus", handleAfterGuardFocus);

    return () => {
      beforeGuard.removeEventListener("focus", handleBeforeGuardFocus);
      afterGuard.removeEventListener("focus", handleAfterGuardFocus);

      if (beforeGuard.parentNode) {
        beforeGuard.parentNode.removeChild(beforeGuard);
      }
      if (afterGuard.parentNode) {
        afterGuard.parentNode.removeChild(afterGuard);
      }

      beforeGuardRef.current = null;
      afterGuardRef.current = null;
    };
  }, [isActive]);

  return { containerRef };
}

/**
 * Hook for managing programmatic focus changes with announcements
 */
export function useFocusAnnouncement() {
  const announce = useCallback((message: string, element?: HTMLElement) => {
    // Create a temporary live region for the announcement
    const liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only";
    liveRegion.textContent = message;

    document.body.appendChild(liveRegion);

    // Focus the element if provided
    if (element) {
      setTimeout(() => {
        element.focus();
      }, 100);
    }

    // Clean up the live region
    setTimeout(() => {
      if (document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion);
      }
    }, 1000);
  }, []);

  return { announce };
}
