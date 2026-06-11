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

  return {
    plugins: [react(), seoSitemapPlugin(siteUrl)],
    envPrefix: ['VITE_', 'REACT_APP_'],
  }
})
