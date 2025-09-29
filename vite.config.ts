import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/terrecielmaraichage.be/' : '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Terre & Ciel Maraîchage',
        short_name: 'Terre & Ciel',
        description: 'Ferme biologique et maraîchage respectueux de l\'environnement',
        theme_color: '#017637',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/img/apple-touch-icon.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true,
    watch: {
      usePolling: true
    }
  }
})