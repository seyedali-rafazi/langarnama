import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const SITEMAP_ROUTES = ['/', '/ship']

function seoSitemapPlugin(siteUrl: string) {
  return {
    name: 'seo-sitemap',
    closeBundle() {
      const base = siteUrl.replace(/\/$/, '')
      const urls = SITEMAP_ROUTES.map(
        (route) => `  <url>\n    <loc>${base}${route === '/' ? '/' : route}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n  </url>`
      ).join('\n')

      writeFileSync(
        resolve(__dirname, 'dist/sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = env.VITE_SITE_URL || 'https://www.langarnama.ir'
  const backendTarget = env.VITE_BACKEND_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [react(), seoSitemapPlugin(siteUrl)],
    envPrefix: ['VITE_', 'REACT_APP_'],
    resolve: {
      alias: [
        {
          find: /^maplibre-gl$/,
          replacement: resolve(__dirname, 'node_modules/maplibre-gl/dist/maplibre-gl.js'),
        },
      ],
    },
    optimizeDeps: {
      include: ['maplibre-gl', 'react-map-gl/maplibre'],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
        '/ws': {
          target: backendTarget,
          ws: true,
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query'
              }
              if (id.includes('maplibre-gl') || id.includes('mapbox-gl') || id.includes('react-map-gl')) {
                return 'vendor-maplibre'
              }
              if (id.includes('@deck.gl') || id.includes('@loaders.gl')) {
                return 'vendor-deckgl'
              }
              if (id.includes('@mui') || id.includes('@emotion')) {
                return 'vendor-mui'
              }
            }
          },
        },
      },
    },
  }
})
