import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/wingman', // GitHub Pages repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  define: {
    // Ensure environment variables are available at build time
    'import.meta.env.VITE_CONVEX_URL': JSON.stringify(process.env.VITE_CONVEX_URL),
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY),
  }
})
