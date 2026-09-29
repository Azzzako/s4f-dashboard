import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const PORT = 7777
const HOST = '127.0.0.1'

// Local-only deployment: binds to loopback so the dashboard is never
// reachable from other devices on the network.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: HOST, port: PORT },
  preview: { host: HOST, port: PORT },
})