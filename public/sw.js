// Service Worker for ACM Manager PWA
const CACHE_NAME = "acm-manager-v1";
const STATIC_CACHE_NAME = "acm-manager-static-v1";
const DYNAMIC_CACHE_NAME = "acm-manager-dynamic-v1";

// Static assets to cache
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/offline.html",
  // Add other critical static assets
];

// API routes to cache
const API_CACHE_PATTERNS = [
  /^\/api\/dashboard/,
  /^\/api\/payroll/,
  /^\/api\/locations/,
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("Service Worker: Static assets cached");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Failed to cache static assets", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME
            ) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === "chrome-extension:") {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with cache-first strategy for specific endpoints
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // Check if this API should be cached
  const shouldCache = API_CACHE_PATTERNS.some((pattern) =>
    pattern.test(url.pathname)
  );

  if (!shouldCache) {
    // For non-cacheable APIs, try network first
    try {
      return await fetch(request);
    } catch (error) {
      // Return a generic offline response for API calls
      return new Response(
        JSON.stringify({
          error: "Offline",
          message: "This feature is not available offline",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  try {
    // Try network first for API requests
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Add a header to indicate this is cached data
      const response = cachedResponse.clone();
      response.headers.set("X-Served-From", "cache");
      return response;
    }

    // No cache available, return offline response
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "This data is not available offline",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache, return offline page
    const offlinePage = await caches.match("/offline.html");
    return offlinePage || new Response("Offline", { status: 503 });
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  // Try cache first for static assets
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Not in cache, try network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed and not in cache
    return new Response("Resource not available offline", { status: 503 });
  }
}

// Background sync
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Get cached sync data
    const cache = await caches.open("background-sync");
    const requests = await cache.keys();

    for (const request of requests) {
      if (request.url.includes("/sync-data/")) {
        const response = await cache.match(request);
        const data = await response.json();

        // Process the sync data
        console.log("Processing background sync data:", data);

        // Remove from cache after processing
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received");

  const options = {
    body: "You have new updates in ACM Manager",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Updates",
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icon-192x192.png",
      },
    ],
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(self.registration.showNotification("ACM Manager", options));
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked");

  event.notification.close();

  if (event.action === "explore") {
    // Open the app
    event.waitUntil(clients.openWindow("/"));
  }
});

// Message handling
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  console.log("Service Worker: Periodic sync triggered", event.tag);

  if (event.tag === "content-sync") {
    event.waitUntil(handlePeriodicSync());
  }
});

async function handlePeriodicSync() {
  try {
    // Sync critical data in the background
    const response = await fetch("/api/sync");

    if (response.ok) {
      const data = await response.json();

      // Cache the updated data
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put("/api/dashboard", new Response(JSON.stringify(data)));

      console.log("Periodic sync completed");
    }
  } catch (error) {
    console.error("Periodic sync failed:", error);
  }
}
