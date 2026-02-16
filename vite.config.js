import { defineConfig } from 'vite'
import { resolve } from 'path'
import { cpSync } from 'fs'

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
        // Copy data/ directory to dist/ for the JSON fetch
        cpSync('data', 'dist/data', { recursive: true })
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
