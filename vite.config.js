import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // binds to 0.0.0.0 so localhost, 127.0.0.1, and local IP all work
    port: 5173,
  },
})
