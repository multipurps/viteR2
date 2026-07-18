import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served at https://multipurps.github.io/Zeeyus/ — a project subpath,
// not the domain root, so asset paths need this base set explicitly.
export default defineConfig({
  base: '/Zeeyus/',
  plugins: [react()],
})
