import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  root: path.resolve(process.cwd(), 'frontend'),
  plugins: [react()],
  build: {
    outDir: path.resolve(process.cwd(), 'buildReact'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: asset => asset.name?.endsWith('.css') ? 'assets/index.css' : 'assets/[name][extname]',
      },
    },
  },
})
