import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({ plugins: [react(), tailwindcss(), cloudflare(), VitePWA({ registerType: 'autoUpdate', manifest: { name: 'Mike & Anna’s Wedding', short_name: 'Mike & Anna', description: 'Your companion for our wedding day', theme_color: '#4F2683', background_color: '#ffffff', display: 'standalone', icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }] }, workbox: { navigateFallback: '/index.html', navigateFallbackDenylist: [/^\/api\//], globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], runtimeCaching: [] } })] });

