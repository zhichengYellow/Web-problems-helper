import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import path from 'node:path'
import { readFileSync } from 'node:fs'

const manifest = JSON.parse(
  readFileSync(path.resolve(__dirname, 'src/manifest.json'), 'utf-8')
)

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@config': path.resolve(__dirname, '../../packages/config/src')
    }
  },
  plugins: [
    react(),
    crx({ manifest })
  ]
})