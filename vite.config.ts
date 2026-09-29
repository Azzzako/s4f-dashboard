import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Local-only deployment: production preview binds to loopback so the
// dashboard is never reachable from other devices on the network.
//
// Dev server (`npm run dev`) intentionally has no `server` field: it falls
// back to Vite defaults (localhost:5173) so working in `dev` doesn't
// clash with the deployed build on 7777.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: { host: '127.0.0.1', port: 7777 },
})