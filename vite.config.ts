import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  base: '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png',],
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
    }),
    // Image optimization (only in production)
    ...(process.env.NODE_ENV === 'production' ? [
      viteImagemin({
        gifsicle: {
          optimizationLevel: 7,
          interlaced: false,
        },
        optipng: {
          optimizationLevel: 7,
        },
        mozjpeg: {
          quality: 80,
        },
        pngquant: {
          quality: [0.8, 0.9],
          speed: 4,
        },
        svgo: {
          plugins: [
            {
              name: 'removeViewBox',
              active: false,
            },
            {
              name: 'removeEmptyAttrs',
              active: false,
            },
          ],
        },
      })
    ] : [])
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
