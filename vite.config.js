import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    base: '/habit-tracker-pwa/',
    plugins: [
        react(),
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.js',
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true,
                type: 'module',
                navigateFallback: 'index.html'
            },
            includeAssets: ['favicon.png', 'apple-touch-icon.png'],
            manifest: {
                name: 'Habit Tracker',
                short_name: 'Habits',
                description: 'Build better habits together with friends',
                theme_color: '#13ec5b',
                background_color: '#f6f8f6',
                display: 'standalone',
                scope: '/habit-tracker-pwa/',
                start_url: '/habit-tracker-pwa/',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
})
