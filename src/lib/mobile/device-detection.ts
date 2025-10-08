// Enhanced device detection and mobile utilities

import { useEffect, useState, useCallback } from "react";

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean; // PWA mode
  orientation: "portrait" | "landscape";
  screenSize: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  pixelRatio: number;
  connectionType?: "slow-2g" | "2g" | "3g" | "4g" | "unknown";
}

// Breakpoints matching Tailwind CSS
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/**
 * Get current screen size category
 */
export function getScreenSize(width: number): DeviceInfo["screenSize"] {
  if (width >= BREAKPOINTS["2xl"]) return "2xl";
  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";
  return "xs";
}

/**
 * Detect device type and capabilities
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    // Server-side defaults
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      isIOS: false,
      isAndroid: false,
      isStandalone: false,
      orientation: "landscape",
      screenSize: "lg",
      pixelRatio: 1,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Device type detection
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Screen size detection
  const screenSize = getScreenSize(width);
  const isMobile = screenSize === "xs" || screenSize === "sm";
  const isTablet =
    (screenSize === "md" || screenSize === "lg") && isTouchDevice;
  const isDesktop = !isMobile && !isTablet;

  // Orientation
  const orientation = height > width ? "portrait" : "landscape";

  // PWA detection
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;

  // Pixel ratio
  const pixelRatio = window.devicePixelRatio || 1;

  // Connection type (if supported)
  let connectionType: DeviceInfo["connectionType"] = "unknown";
  if ("connection" in navigator) {
    const connection = (navigator as any).connection;
    connectionType = connection.effectiveType || "unknown";
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isIOS,
    isAndroid,
    isStandalone,
    orientation,
    screenSize,
    pixelRatio,
    connectionType,
  };
}

/**
 * Hook for device information with reactive updates
 */
export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() =>
    getDeviceInfo()
  );

  const updateDeviceInfo = useCallback(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  useEffect(() => {
    // Update on resize
    window.addEventListener("resize", updateDeviceInfo);

    // Update on orientation change
    window.addEventListener("orientationchange", updateDeviceInfo);

    // Update on connection change
    if ("connection" in navigator) {
      (navigator as any).connection.addEventListener(
        "change",
        updateDeviceInfo
      );
    }

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
      window.removeEventListener("orientationchange", updateDeviceInfo);

      if ("connection" in navigator) {
        (navigator as any).connection.removeEventListener(
          "change",
          updateDeviceInfo
        );
      }
    };
  }, [updateDeviceInfo]);

  return deviceInfo;
}

/**
 * Enhanced mobile detection hook (replaces useIsMobile)
 */
export function useIsMobile(): boolean {
  const { isMobile } = useDeviceInfo();
  return isMobile;
}

/**
 * Hook for responsive breakpoint detection
 */
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(min-width: ${BREAKPOINTS[breakpoint]}px)`
    );

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [breakpoint]);

  return matches;
}

/**
 * Hook for orientation detection
 */
export function useOrientation(): "portrait" | "landscape" {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? "portrait" : "landscape"
      );
    };

    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  return orientation;
}

/**
 * Hook for network connection status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] =
    useState<DeviceInfo["connectionType"]>("unknown");

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionType = () => {
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        setConnectionType(connection.effectiveType || "unknown");
      }
    };

    updateOnlineStatus();
    updateConnectionType();

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    if ("connection" in navigator) {
      (navigator as any).connection.addEventListener(
        "change",
        updateConnectionType
      );
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);

      if ("connection" in navigator) {
        (navigator as any).connection.removeEventListener(
          "change",
          updateConnectionType
        );
      }
    };
  }, []);

  return { isOnline, connectionType };
}

/**
 * Utility to check if device supports specific features
 */
export function supportsFeature(feature: string): boolean {
  switch (feature) {
    case "touch":
      return "ontouchstart" in window || navigator.maxTouchPoints > 0;
    case "vibration":
      return "vibrate" in navigator;
    case "geolocation":
      return "geolocation" in navigator;
    case "camera":
      return (
        "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices
      );
    case "notifications":
      return "Notification" in window;
    case "serviceWorker":
      return "serviceWorker" in navigator;
    case "webShare":
      return "share" in navigator;
    case "clipboard":
      return "clipboard" in navigator;
    case "wakeLock":
      return "wakeLock" in navigator;
    default:
      return false;
  }
}

/**
 * Get safe area insets for devices with notches/rounded corners
 */
export function getSafeAreaInsets() {
  if (typeof window === "undefined") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(
      style.getPropertyValue("env(safe-area-inset-top)") || "0",
      10
    ),
    right: parseInt(
      style.getPropertyValue("env(safe-area-inset-right)") || "0",
      10
    ),
    bottom: parseInt(
      style.getPropertyValue("env(safe-area-inset-bottom)") || "0",
      10
    ),
    left: parseInt(
      style.getPropertyValue("env(safe-area-inset-left)") || "0",
      10
    ),
  };
}

/**
 * Hook for safe area insets
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState(() => getSafeAreaInsets());

  useEffect(() => {
    const updateInsets = () => {
      setInsets(getSafeAreaInsets());
    };

    window.addEventListener("resize", updateInsets);
    window.addEventListener("orientationchange", updateInsets);

    return () => {
      window.removeEventListener("resize", updateInsets);
      window.removeEventListener("orientationchange", updateInsets);
    };
  }, []);

  return insets;
}
