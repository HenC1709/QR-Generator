import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base './' hace que el build funcione en cualquier carpeta o subruta
// (GitHub Pages, Netlify, abrir desde un servidor estático, etc.)
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
