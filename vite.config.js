import { defineConfig } from 'vite'

export default defineConfig({
  // Base URL for production deployment
  base: '/',
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate sourcemaps for better debugging
    sourcemap: true,
    // Ensure assets are copied to build
    assetsInclude: ['**/*.png', '**/*.svg', '**/*.jpg', '**/*.gif'],
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true, // Open browser on server start
  },
})
