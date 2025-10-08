// Touch gesture utilities and hooks

import { useEffect, useRef, useCallback, useState } from "react";

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeGesture {
  direction: "left" | "right" | "up" | "down";
  distance: number;
  velocity: number;
  duration: number;
}

export interface PinchGesture {
  scale: number;
  center: TouchPoint;
}

export interface GestureConfig {
  swipeThreshold?: number;
  swipeVelocityThreshold?: number;
  pinchThreshold?: number;
  longPressDelay?: number;
  preventScroll?: boolean;
}

const DEFAULT_CONFIG: Required<GestureConfig> = {
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
  pinchThreshold: 0.1,
  longPressDelay: 500,
  preventScroll: false,
};

/**
 * Hook for swipe gestures
 */
export function useSwipeGesture<T extends HTMLElement>(
  onSwipe: (gesture: SwipeGesture) => void,
  config: GestureConfig = {}
) {
  const elementRef = useRef<T>(null);
  const startPoint = useRef<TouchPoint | null>(null);
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      startPoint.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      if (configRef.current.preventScroll) {
        e.preventDefault();
      }
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!startPoint.current || e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const endPoint: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      const deltaX = endPoint.x - startPoint.current.x;
      const deltaY = endPoint.y - startPoint.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = endPoint.timestamp - startPoint.current.timestamp;
      const velocity = distance / duration;

      if (
        distance >= configRef.current.swipeThreshold &&
        velocity >= configRef.current.swipeVelocityThreshold
      ) {
        let direction: SwipeGesture["direction"];

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? "right" : "left";
        } else {
          direction = deltaY > 0 ? "down" : "up";
        }

        onSwipe({
          direction,
          distance,
          velocity,
          duration,
        });
      }

      startPoint.current = null;
    },
    [onSwipe]
  );

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (configRef.current.preventScroll && startPoint.current) {
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, {
      passive: !config.preventScroll,
    });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, {
      passive: !config.preventScroll,
    });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleTouchStart, handleTouchEnd, handleTouchMove, config.preventScroll]);

  return elementRef;
}

/**
 * Hook for pinch/zoom gestures
 */
export function usePinchGesture<T extends HTMLElement>(
  onPinch: (gesture: PinchGesture) => void,
  config: GestureConfig = {}
) {
  const elementRef = useRef<T>(null);
  const initialDistance = useRef<number>(0);
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: Touch, touch2: Touch): TouchPoint => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
    timestamp: Date.now(),
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);

      if (configRef.current.preventScroll) {
        e.preventDefault();
      }
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance.current > 0) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance.current;

        if (Math.abs(scale - 1) >= configRef.current.pinchThreshold) {
          const center = getCenter(e.touches[0], e.touches[1]);

          onPinch({
            scale,
            center,
          });
        }

        if (configRef.current.preventScroll) {
          e.preventDefault();
        }
      }
    },
    [onPinch]
  );

  const handleTouchEnd = useCallback(() => {
    initialDistance.current = 0;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, {
      passive: !config.preventScroll,
    });
    element.addEventListener("touchmove", handleTouchMove, {
      passive: !config.preventScroll,
    });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, config.preventScroll]);

  return elementRef;
}

/**
 * Hook for long press gestures
 */
export function useLongPress<T extends HTMLElement>(
  onLongPress: () => void,
  config: GestureConfig = {}
) {
  const elementRef = useRef<T>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });

  const startLongPress = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      onLongPress();
    }, configRef.current.longPressDelay);
  }, [onLongPress]);

  const cancelLongPress = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(() => {
    startLongPress();
  }, [startLongPress]);

  const handleTouchEnd = useCallback(() => {
    cancelLongPress();
  }, [cancelLongPress]);

  const handleTouchMove = useCallback(() => {
    cancelLongPress();
  }, [cancelLongPress]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    // Also support mouse events for testing
    element.addEventListener("mousedown", startLongPress);
    element.addEventListener("mouseup", cancelLongPress);
    element.addEventListener("mouseleave", cancelLongPress);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchcancel", handleTouchEnd);
      element.removeEventListener("mousedown", startLongPress);
      element.removeEventListener("mouseup", cancelLongPress);
      element.removeEventListener("mouseleave", cancelLongPress);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    startLongPress,
    cancelLongPress,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
  ]);

  return elementRef;
}

/**
 * Hook for tap gestures with double-tap detection
 */
export function useTapGesture<T extends HTMLElement>(
  onTap: () => void,
  onDoubleTap?: () => void,
  doubleTapDelay: number = 300
) {
  const elementRef = useRef<T>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (onDoubleTap && timeSinceLastTap < doubleTapDelay) {
      // Double tap detected
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      onDoubleTap();
    } else {
      // Single tap - wait to see if there's a second tap
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }

      tapTimeoutRef.current = setTimeout(
        () => {
          onTap();
          tapTimeoutRef.current = null;
        },
        onDoubleTap ? doubleTapDelay : 0
      );
    }

    lastTapRef.current = now;
  }, [onTap, onDoubleTap, doubleTapDelay]);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        handleTap();
      }
    },
    [handleTap]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("click", handleTap);

    return () => {
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("click", handleTap);

      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, [handleTouchEnd, handleTap]);

  return elementRef;
}

/**
 * Hook for pull-to-refresh gesture
 */
export function usePullToRefresh<T extends HTMLElement>(
  onRefresh: () => Promise<void>,
  threshold: number = 80
) {
  const elementRef = useRef<T>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1 && window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (startY.current === 0 || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);

      if (distance > 0 && window.scrollY === 0) {
        setPullDistance(distance);
        e.preventDefault();
      }
    },
    [isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    startY.current = 0;
    currentY.current = 0;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    isRefreshing,
    pullDistance,
    isTriggered: pullDistance >= threshold,
  };
}

/**
 * Utility to prevent default touch behaviors
 */
export function preventTouchDefaults(
  element: HTMLElement,
  options: {
    preventScroll?: boolean;
    preventZoom?: boolean;
    preventSelection?: boolean;
  } = {}
) {
  const {
    preventScroll = false,
    preventZoom = false,
    preventSelection = false,
  } = options;

  if (preventScroll) {
    element.style.touchAction = "none";
  }

  if (preventZoom) {
    element.style.touchAction = "manipulation";
  }

  if (preventSelection) {
    element.style.userSelect = "none";
    element.style.webkitUserSelect = "none";
  }

  return () => {
    element.style.touchAction = "";
    element.style.userSelect = "";
    element.style.webkitUserSelect = "";
  };
}
