// Progressive Web App utilities and offline support

import { useEffect, useState, useCallback, useRef } from "react";

// Type declarations for Background Sync API (not yet in standard TypeScript DOM types)
declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
      getTags(): Promise<string[]>;
    };
  }

  interface SyncManager {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }
}

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isControlling: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
}

export interface OfflineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  offlineDuration: number;
}

/**
 * Hook for PWA installation
 */
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(
    null
  );
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as any;
      setInstallPrompt(promptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error("PWA installation failed:", error);
      return false;
    }
  }, [installPrompt]);

  return {
    isInstallable,
    isInstalled,
    install,
  };
}

/**
 * Hook for service worker management
 */
export function useServiceWorker(swPath: string = "/sw.js") {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isControlling: false,
    registration: null,
    updateAvailable: false,
  });

  const updateServiceWorker = useCallback(async () => {
    if (!status.registration) return;

    const waitingWorker = status.registration.waiting;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  }, [status.registration]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    setStatus((prev) => ({ ...prev, isSupported: true }));

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(swPath);

        setStatus((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
          isControlling: !!navigator.serviceWorker.controller,
        }));

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setStatus((prev) => ({ ...prev, updateAvailable: true }));
              }
            });
          }
        });

        // Listen for controlling service worker changes
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          setStatus((prev) => ({ ...prev, isControlling: true }));
        });
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    registerSW();
  }, [swPath]);

  return {
    ...status,
    updateServiceWorker,
  };
}

/**
 * Hook for offline status and caching
 */
export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    wasOffline: false,
    offlineDuration: 0,
  });
  const offlineStartTime = useRef<number | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      const now = Date.now();
      const duration = offlineStartTime.current
        ? now - offlineStartTime.current
        : 0;

      setStatus({
        isOnline: true,
        wasOffline: duration > 0,
        offlineDuration: duration,
      });

      offlineStartTime.current = null;
    };

    const handleOffline = () => {
      offlineStartTime.current = Date.now();
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return status;
}

/**
 * Hook for background sync
 */
export function useBackgroundSync(tag: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      try {
        if (
          "serviceWorker" in navigator &&
          "sync" in window.ServiceWorkerRegistration.prototype
        ) {
          setIsSupported(true);
        }
      } catch (error) {
        // Background Sync API not supported
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  const registerSync = useCallback(
    async (data?: any) => {
      if (!isSupported) return false;

      try {
        const registration = await navigator.serviceWorker.ready;

        // Store data for sync if provided
        if (data) {
          const cache = await caches.open("background-sync");
          await cache.put(
            `/sync-data/${tag}`,
            new Response(JSON.stringify(data))
          );
        }

        // Use Background Sync API with proper typing
        await registration.sync?.register(tag);
        setIsRegistered(true);
        return true;
      } catch (error) {
        console.error("Background sync registration failed:", error);
        return false;
      }
    },
    [isSupported, tag]
  );

  return {
    isSupported,
    isRegistered,
    registerSync,
  };
}

/**
 * Hook for push notifications
 */
export function usePushNotifications() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );

  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Notification permission request failed:", error);
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(
    async (vapidPublicKey: string) => {
      if (!isSupported || permission !== "granted") return null;

      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });

        setSubscription(sub);
        return sub;
      } catch (error) {
        console.error("Push subscription failed:", error);
        return null;
      }
    },
    [isSupported, permission]
  );

  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      return true;
    } catch (error) {
      console.error("Push unsubscription failed:", error);
      return false;
    }
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook for app updates
 */
export function useAppUpdates() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const checkForUpdates = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (error) {
      console.error("Update check failed:", error);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!updateAvailable) return;

    setIsUpdating(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const waitingWorker = registration?.waiting;

      if (waitingWorker) {
        waitingWorker.postMessage({ type: "SKIP_WAITING" });

        // Wait for the new service worker to take control
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => {
              resolve();
            },
            { once: true }
          );
        });

        window.location.reload();
      }
    } catch (error) {
      console.error("Update application failed:", error);
    } finally {
      setIsUpdating(false);
    }
  }, [updateAvailable]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleUpdateFound = () => {
      setUpdateAvailable(true);
    };

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "UPDATE_AVAILABLE") {
        setUpdateAvailable(true);
      }
    });

    // Check for updates periodically
    const interval = setInterval(checkForUpdates, 60000); // Check every minute

    return () => {
      clearInterval(interval);
    };
  }, [checkForUpdates]);

  return {
    updateAvailable,
    isUpdating,
    checkForUpdates,
    applyUpdate,
  };
}

/**
 * Utility to cache resources
 */
export async function cacheResources(cacheName: string, resources: string[]) {
  if (!("caches" in window)) return false;

  try {
    const cache = await caches.open(cacheName);
    await cache.addAll(resources);
    return true;
  } catch (error) {
    console.error("Resource caching failed:", error);
    return false;
  }
}

/**
 * Utility to get cached resource
 */
export async function getCachedResource(url: string): Promise<Response | null> {
  if (!("caches" in window)) return null;

  try {
    const response = await caches.match(url);
    return response || null;
  } catch (error) {
    console.error("Cache retrieval failed:", error);
    return null;
  }
}

/**
 * Utility to clear old caches
 */
export async function clearOldCaches(currentCacheNames: string[]) {
  if (!("caches" in window)) return;

  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(
      (name) => !currentCacheNames.includes(name)
    );

    await Promise.all(oldCaches.map((cacheName) => caches.delete(cacheName)));
  } catch (error) {
    console.error("Cache cleanup failed:", error);
  }
}
