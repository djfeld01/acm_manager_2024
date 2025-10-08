// Keyboard navigation utilities and hooks

import { useEffect, useCallback, useRef } from "react";
import { KEYBOARD_KEYS, FOCUS_SELECTORS } from "./constants";

/**
 * Hook for handling keyboard navigation in lists/menus
 */
export function useKeyboardNavigation<T extends HTMLElement>({
  isOpen,
  onClose,
  onSelect,
  itemSelector = '[role="menuitem"], [role="option"], button:not([disabled]), a[href]',
  loop = true,
  orientation = "vertical",
}: {
  isOpen: boolean;
  onClose?: () => void;
  onSelect?: (index: number) => void;
  itemSelector?: string;
  loop?: boolean;
  orientation?: "vertical" | "horizontal";
}) {
  const containerRef = useRef<T>(null);
  const activeIndexRef = useRef<number>(-1);

  const getItems = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll(itemSelector)
    ) as HTMLElement[];
  }, [itemSelector]);

  const focusItem = useCallback(
    (index: number) => {
      const items = getItems();
      if (items[index]) {
        items[index].focus();
        activeIndexRef.current = index;
      }
    },
    [getItems]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      const items = getItems();
      if (items.length === 0) return;

      const currentIndex = activeIndexRef.current;
      let nextIndex = currentIndex;

      switch (event.key) {
        case KEYBOARD_KEYS.ESCAPE:
          event.preventDefault();
          onClose?.();
          break;

        case KEYBOARD_KEYS.ARROW_DOWN:
          if (orientation === "vertical") {
            event.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= items.length) {
              nextIndex = loop ? 0 : items.length - 1;
            }
            focusItem(nextIndex);
          }
          break;

        case KEYBOARD_KEYS.ARROW_UP:
          if (orientation === "vertical") {
            event.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? items.length - 1 : 0;
            }
            focusItem(nextIndex);
          }
          break;

        case KEYBOARD_KEYS.ARROW_RIGHT:
          if (orientation === "horizontal") {
            event.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= items.length) {
              nextIndex = loop ? 0 : items.length - 1;
            }
            focusItem(nextIndex);
          }
          break;

        case KEYBOARD_KEYS.ARROW_LEFT:
          if (orientation === "horizontal") {
            event.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? items.length - 1 : 0;
            }
            focusItem(nextIndex);
          }
          break;

        case KEYBOARD_KEYS.HOME:
          event.preventDefault();
          focusItem(0);
          break;

        case KEYBOARD_KEYS.END:
          event.preventDefault();
          focusItem(items.length - 1);
          break;

        case KEYBOARD_KEYS.ENTER:
        case KEYBOARD_KEYS.SPACE:
          if (currentIndex >= 0 && currentIndex < items.length) {
            event.preventDefault();
            onSelect?.(currentIndex);
          }
          break;
      }
    },
    [isOpen, getItems, focusItem, onClose, onSelect, loop, orientation]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Reset active index when closed
  useEffect(() => {
    if (!isOpen) {
      activeIndexRef.current = -1;
    }
  }, [isOpen]);

  return {
    containerRef,
    focusItem,
    getItems,
  };
}

/**
 * Hook for managing focus trap in modals/dialogs
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll(FOCUS_SELECTORS.FOCUSABLE_ELEMENTS)
    ) as HTMLElement[];
  }, []);

  const focusFirstElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  const focusLastElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive || event.key !== KEYBOARD_KEYS.TAB) return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [isActive, getFocusableElements]
  );

  useEffect(() => {
    if (isActive) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the first focusable element
      setTimeout(focusFirstElement, 0);

      // Add event listener
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);

        // Restore focus to the previously focused element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isActive, focusFirstElement, handleKeyDown]);

  return {
    containerRef,
    focusFirstElement,
    focusLastElement,
  };
}

/**
 * Hook for handling roving tabindex pattern
 */
export function useRovingTabIndex<T extends HTMLElement>({
  itemSelector = '[role="tab"], [role="menuitem"], button:not([disabled])',
  defaultIndex = 0,
  orientation = "horizontal",
}: {
  itemSelector?: string;
  defaultIndex?: number;
  orientation?: "horizontal" | "vertical";
} = {}) {
  const containerRef = useRef<T>(null);
  const activeIndexRef = useRef<number>(defaultIndex);

  const getItems = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll(itemSelector)
    ) as HTMLElement[];
  }, [itemSelector]);

  const updateTabIndex = useCallback(
    (activeIndex: number) => {
      const items = getItems();
      items.forEach((item, index) => {
        item.tabIndex = index === activeIndex ? 0 : -1;
      });
      activeIndexRef.current = activeIndex;
    },
    [getItems]
  );

  const focusItem = useCallback(
    (index: number) => {
      const items = getItems();
      if (items[index]) {
        updateTabIndex(index);
        items[index].focus();
      }
    },
    [getItems, updateTabIndex]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const items = getItems();
      if (items.length === 0) return;

      const currentIndex = activeIndexRef.current;
      let nextIndex = currentIndex;

      const isVerticalKey =
        event.key === KEYBOARD_KEYS.ARROW_UP ||
        event.key === KEYBOARD_KEYS.ARROW_DOWN;
      const isHorizontalKey =
        event.key === KEYBOARD_KEYS.ARROW_LEFT ||
        event.key === KEYBOARD_KEYS.ARROW_RIGHT;

      if (
        (orientation === "vertical" && isVerticalKey) ||
        (orientation === "horizontal" && isHorizontalKey)
      ) {
        event.preventDefault();

        if (
          event.key === KEYBOARD_KEYS.ARROW_DOWN ||
          event.key === KEYBOARD_KEYS.ARROW_RIGHT
        ) {
          nextIndex = (currentIndex + 1) % items.length;
        } else {
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) nextIndex = items.length - 1;
        }

        focusItem(nextIndex);
      } else if (event.key === KEYBOARD_KEYS.HOME) {
        event.preventDefault();
        focusItem(0);
      } else if (event.key === KEYBOARD_KEYS.END) {
        event.preventDefault();
        focusItem(items.length - 1);
      }
    },
    [getItems, focusItem, orientation]
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      const items = getItems();
      const clickedItem = event.target as HTMLElement;
      const index = items.indexOf(clickedItem);

      if (index >= 0) {
        updateTabIndex(index);
      }
    },
    [getItems, updateTabIndex]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize tabindex
    updateTabIndex(defaultIndex);

    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("click", handleClick);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("click", handleClick);
    };
  }, [handleKeyDown, handleClick, updateTabIndex, defaultIndex]);

  return {
    containerRef,
    focusItem,
    updateTabIndex,
  };
}

/**
 * Utility to check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;

  return element.matches(FOCUS_SELECTORS.FOCUSABLE_ELEMENTS);
}

/**
 * Utility to find the next focusable element
 */
export function getNextFocusableElement(
  currentElement: HTMLElement,
  direction: "next" | "previous" = "next"
): HTMLElement | null {
  const focusableElements = Array.from(
    document.querySelectorAll(FOCUS_SELECTORS.FOCUSABLE_ELEMENTS)
  ) as HTMLElement[];

  const currentIndex = focusableElements.indexOf(currentElement);
  if (currentIndex === -1) return null;

  const nextIndex =
    direction === "next"
      ? (currentIndex + 1) % focusableElements.length
      : currentIndex - 1 < 0
      ? focusableElements.length - 1
      : currentIndex - 1;

  return focusableElements[nextIndex] || null;
}
