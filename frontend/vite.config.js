import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,   // React frontend runs on port 3000
    proxy: {
      // Any request to /api/** gets forwarded to the Node backend on port 5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,   // fixes Host header mismatches
        secure: false,
      },
    },
  },
})
