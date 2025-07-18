const CACHE_NAME = "photo-uploader-v1"
const STATIC_CACHE = "static-v1"
const DYNAMIC_CACHE = "dynamic-v1"

const STATIC_ASSETS = ["/", "/manifest.json", "/icons/icon-192x192.png", "/icons/icon-512x512.png"]

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...")
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting()),
  )
})

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("Service Worker: Deleting old cache", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch event
self.addEventListener("fetch", (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Handle API requests differently
  if (request.url.includes("/upload")) {
    event.respondWith(
      fetch(request).catch(() => {
        // Store failed uploads for background sync
        return new Response(JSON.stringify({ error: "Offline - upload will retry when online" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      }),
    )
    return
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response
      }

      return fetch(request)
        .then((fetchResponse) => {
          // Don't cache if not a valid response
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== "basic") {
            return fetchResponse
          }

          const responseToCache = fetchResponse.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache)
          })

          return fetchResponse
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.destination === "document") {
            return caches.match("/")
          }
        })
    }),
  )
})

// Background sync for failed uploads
self.addEventListener("sync", (event) => {
  if (event.tag === "upload-retry") {
    event.waitUntil(retryFailedUploads())
  }
})

async function retryFailedUploads() {
  // Implementation for retrying failed uploads
  console.log("Retrying failed uploads...")
}

// Push notifications (optional)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Upload completed!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View uploads",
        icon: "/icons/checkmark.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/xmark.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Photo Uploader", options))
})
