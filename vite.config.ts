import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: process.env.E2E
      ? undefined
      : {
          '/api': {
            target: 'http://127.0.0.1:8080',
            changeOrigin: true,
          },
        },
  },
})
