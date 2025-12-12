import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    // Open the app
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url.includes('/') && 'focus' in client) {
                    return client.focus()
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow('/')
            }
        })
    )
})

// Optional: Handle Push events if we add Push implementation later
self.addEventListener('push', (event) => {
    // Logic for push parsing would go here
})
