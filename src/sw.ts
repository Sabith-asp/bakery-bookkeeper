/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare const self: ServiceWorkerGlobalScope

clientsClaim()
self.skipWaiting()

// Injected precache manifest (replaced at build time by vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA navigation fallback — all nav requests serve index.html except /api
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api/],
  })
)

// API — NetworkFirst: fresh when online, cached when offline
registerRoute(
  ({ url }) => url.pathname.includes('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 86400 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

// External images — CacheFirst: rarely change
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 2592000 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

// Google Fonts — CacheFirst: immutable
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536000 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json() as { title?: string; body?: string; url?: string }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Fynlo', {
      body: data.body ?? '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = (event.notification.data?.url as string) ?? '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus()
          }
        }
        return clients.openWindow(targetUrl)
      })
  )
})
