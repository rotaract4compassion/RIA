import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/**', 'partners/**', 'splash/**'],
      manifest: {
        name: 'Ria — Rotary/Rotaract in Action',
        short_name: 'Ria',
        description: 'Field data collection for Rotary/Rotaract community action projects across Africa.',
        theme_color: '#E91E8C',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/ria-app-icon-whitebg-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/ria-app-icon-whitebg-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/ria-app-icon-whitebg-apple-touch-icon-180.png', sizes: '180x180', type: 'image/png' },
          { src: '/icons/ria-app-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
