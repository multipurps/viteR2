import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Hosted on Vercel at the domain root — no subpath, unlike the earlier
// GitHub Pages attempt (which needed base: '/Zeeyus/').
export default defineConfig({
  plugins: [react()],
})
