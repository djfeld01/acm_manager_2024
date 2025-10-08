// Touch interaction utilities and enhancements

import { useEffect, useRef, useCallback } from "react";

export interface TouchFeedbackOptions {
  haptic?: boolean;
  visual?: boolean;
  audio?: boolean;
  duration?: number;
}

export interface TouchTargetOptions {
  minSize?: number;
  padding?: number;
  ripple?: boolean;
  feedback?: TouchFeedbackOptions;
}

const DEFAULT_TOUCH_OPTIONS: Required<TouchTargetOptions> = {
  minSize: 44,
  padding: 8,
  ripple: true,
  feedback: {
    haptic: true,
    visual: true,
    audio: false,
    duration: 150,
  },
};

/**
 * Provide haptic feedback if supported
 */
export function hapticFeedback(
  type: "light" | "medium" | "heavy" | "selection" = "light"
) {
  if ("vibrate" in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      selection: [5],
    };

    navigator.vibrate(patterns[type]);
  }
}

/**
 * Hook for enhanced touch interactions
 */
export function useTouchEnhancement<T extends HTMLElement>(
  options: TouchTargetOptions = {}
) {
  const elementRef = useRef<T>(null);
  const rippleRef = useRef<HTMLElement | null>(null);
  const config = { ...DEFAULT_TOUCH_OPTIONS, ...options };

  const createRipple = useCallback(
    (e: TouchEvent | MouseEvent) => {
      const element = elementRef.current;
      if (!element || !config.ripple) return;

      // Remove existing ripple
      if (rippleRef.current) {
        rippleRef.current.remove();
        rippleRef.current = null;
      }

      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x =
        (e instanceof TouchEvent ? e.touches[0].clientX : e.clientX) -
        rect.left -
        size / 2;
      const y =
        (e instanceof TouchEvent ? e.touches[0].clientY : e.clientY) -
        rect.top -
        size / 2;

      const ripple = document.createElement("span");
      ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple ${config.feedback.duration}ms linear;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
      z-index: 1000;
    `;

      // Add ripple animation keyframes if not already added
      if (!document.querySelector("#ripple-keyframes")) {
        const style = document.createElement("style");
        style.id = "ripple-keyframes";
        style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `;
        document.head.appendChild(style);
      }

      element.style.position = element.style.position || "relative";
      element.style.overflow = "hidden";
      element.appendChild(ripple);
      rippleRef.current = ripple;

      // Clean up ripple after animation
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
        if (rippleRef.current === ripple) {
          rippleRef.current = null;
        }
      }, config.feedback.duration);
    },
    [config.ripple, config.feedback.duration]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (config.feedback.haptic) {
        hapticFeedback("light");
      }

      if (config.feedback.visual) {
        createRipple(e);
      }

      // Add pressed state
      const element = elementRef.current;
      if (element) {
        element.style.transform = "scale(0.98)";
        element.style.transition = "transform 0.1s ease";
      }
    },
    [config.feedback.haptic, config.feedback.visual, createRipple]
  );

  const handleTouchEnd = useCallback(() => {
    const element = elementRef.current;
    if (element) {
      element.style.transform = "";
      element.style.transition = "";
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (config.feedback.visual) {
        createRipple(e);
      }
    },
    [config.feedback.visual, createRipple]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Ensure minimum touch target size
    const computedStyle = window.getComputedStyle(element);
    const currentWidth = parseInt(computedStyle.width, 10);
    const currentHeight = parseInt(computedStyle.height, 10);

    if (currentWidth < config.minSize || currentHeight < config.minSize) {
      element.style.minWidth = `${config.minSize}px`;
      element.style.minHeight = `${config.minSize}px`;
      element.style.padding = element.style.padding || `${config.padding}px`;
    }

    // Add touch event listeners
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    element.addEventListener("mousedown", handleMouseDown, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
      element.removeEventListener("mousedown", handleMouseDown);

      // Clean up ripple
      if (rippleRef.current) {
        rippleRef.current.remove();
        rippleRef.current = null;
      }
    };
  }, [
    handleTouchStart,
    handleTouchEnd,
    handleMouseDown,
    config.minSize,
    config.padding,
  ]);

  return elementRef;
}

/**
 * Hook for optimized scrolling on mobile
 */
export function useOptimizedScrolling<T extends HTMLElement>(
  options: {
    momentum?: boolean;
    bounce?: boolean;
    threshold?: number;
  } = {}
) {
  const elementRef = useRef<T>(null);
  const { momentum = true, bounce = false, threshold = 10 } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Apply CSS optimizations
    (element.style as any).webkitOverflowScrolling = momentum
      ? "touch"
      : "auto";
    element.style.overscrollBehavior = bounce ? "auto" : "contain";

    // Add scroll threshold for performance
    let ticking = false;
    let lastScrollY = 0;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = element.scrollTop;
          const delta = Math.abs(currentScrollY - lastScrollY);

          if (delta > threshold) {
            // Trigger scroll optimizations
            element.style.pointerEvents = "none";

            setTimeout(() => {
              element.style.pointerEvents = "";
            }, 150);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    element.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, [momentum, bounce, threshold]);

  return elementRef;
}

/**
 * Hook for touch-friendly drag and drop
 */
export function useTouchDragDrop<T extends HTMLElement>(
  onDragStart?: (e: TouchEvent) => void,
  onDragMove?: (e: TouchEvent, deltaX: number, deltaY: number) => void,
  onDragEnd?: (e: TouchEvent) => void
) {
  const elementRef = useRef<T>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        startPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        currentPos.current = { ...startPos.current };

        onDragStart?.(e);
      }
    },
    [onDragStart]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - currentPos.current.x;
      const deltaY = touch.clientY - currentPos.current.y;

      currentPos.current = {
        x: touch.clientX,
        y: touch.clientY,
      };

      onDragMove?.(e, deltaX, deltaY);
      e.preventDefault();
    },
    [onDragMove]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (isDragging.current) {
        isDragging.current = false;
        onDragEnd?.(e);
      }
    },
    [onDragEnd]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    isDragging: isDragging.current,
  };
}

/**
 * Utility to make any element touch-friendly
 */
export function makeTouchFriendly(
  element: HTMLElement,
  options: TouchTargetOptions = {}
) {
  const config = { ...DEFAULT_TOUCH_OPTIONS, ...options };

  // Ensure minimum size
  const rect = element.getBoundingClientRect();
  if (rect.width < config.minSize || rect.height < config.minSize) {
    element.style.minWidth = `${config.minSize}px`;
    element.style.minHeight = `${config.minSize}px`;
    element.style.padding = element.style.padding || `${config.padding}px`;
  }

  // Add touch-friendly styles
  element.style.cursor = "pointer";
  element.style.userSelect = "none";
  (element.style as any).webkitTapHighlightColor = "transparent";

  // Add touch feedback
  const handleTouchStart = () => {
    if (config.feedback.haptic) {
      hapticFeedback("light");
    }
    element.style.opacity = "0.7";
  };

  const handleTouchEnd = () => {
    element.style.opacity = "";
  };

  element.addEventListener("touchstart", handleTouchStart, { passive: true });
  element.addEventListener("touchend", handleTouchEnd, { passive: true });
  element.addEventListener("touchcancel", handleTouchEnd, { passive: true });

  return () => {
    element.removeEventListener("touchstart", handleTouchStart);
    element.removeEventListener("touchend", handleTouchEnd);
    element.removeEventListener("touchcancel", handleTouchEnd);
  };
}

/**
 * Hook for preventing zoom on double tap
 */
export function usePreventZoom<T extends HTMLElement>() {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.style.touchAction = "manipulation";

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    element.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  return elementRef;
}
