import { defineConfig } from 'vite'
import { resolve } from 'path'
import { cpSync, copyFileSync, existsSync } from 'fs'

export default defineConfig({
  root: '.',
  base: '/',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  },
  plugins: [
    {
      name: 'copy-static-assets',
      closeBundle() {
        cpSync('data', 'dist/data', { recursive: true })
        cpSync('assets', 'dist/assets', { recursive: true })
        if (existsSync('sitemap.xml')) copyFileSync('sitemap.xml', 'dist/sitemap.xml')
        if (existsSync('robots.txt')) copyFileSync('robots.txt', 'dist/robots.txt')
        if (existsSync('404.html')) copyFileSync('404.html', 'dist/404.html')
        if (existsSync('_headers')) copyFileSync('_headers', 'dist/_headers')
        if (existsSync('_redirects')) copyFileSync('_redirects', 'dist/_redirects')
        for (const f of ['disclosure.html', 'privacy.html', 'links.html']) {
          if (existsSync(f)) copyFileSync(f, `dist/${f}`)
        }
      }
    }
  ],
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173
  }
})
