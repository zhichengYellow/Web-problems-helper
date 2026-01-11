import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { chromeExtension } from 'vite-plugin-chrome-extension'
import path from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'src/manifest.json'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@utils': path.resolve(__dirname, '../utils/src'),
      '@config': path.resolve(__dirname, '../config/src')
    }
  },
  plugins: [
    react(),
    chromeExtension({
      manifest: path.resolve(__dirname, 'src/manifest.json')
    })
  ]
})