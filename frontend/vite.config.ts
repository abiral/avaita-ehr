import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // The manifest lets scripts/bundle-budget.mjs measure what the first route loads.
  build: { manifest: true },
  server: {
    proxy: { '/api': { target: process.env['API_PROXY_TARGET'] ?? 'http://localhost:8080', changeOrigin: true } },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.test.*', 'src/main.tsx', 'src/infrastructure/mock/**'],
      thresholds: {
        lines: 75,
        'src/domain/**': { lines: 95, branches: 90 },
        'src/application/**': { lines: 90, branches: 85 },
      },
    },
  },
})
