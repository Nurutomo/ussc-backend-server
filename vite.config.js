import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  root: path.resolve(process.cwd(), 'frontend'),
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHost: 'all',
    proxy: {
      '/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(process.cwd(), 'frontend/build'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (asset) => (asset.name?.endsWith('.css') ? 'assets/index.css' : 'assets/[name][extname]'),
      },
    },
  },
})
