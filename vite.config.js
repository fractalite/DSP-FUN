import { defineConfig } from 'vite'
import { loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    // Base URL for production deployment
    base: '/',
    
    // Build configuration
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      assetsInclude: ['**/*.png', '**/*.svg', '**/*.jpg', '**/*.gif', '**/*.mp3'],
      rollupOptions: {
        input: {
          main: './index.html'
        }
      }
    },

    // Define environment variables to expose to the frontend
    define: {
      'import.meta.env.VITE_ENABLE_AI': JSON.stringify(env.VITE_ENABLE_AI),
      'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(env.VITE_GROQ_API_KEY),
      'import.meta.env.VITE_GROQ_API_URL': JSON.stringify(env.VITE_GROQ_API_URL),
      'import.meta.env.VITE_GROQ_MODEL_ID': JSON.stringify(env.VITE_GROQ_MODEL_ID)
    },

    // Development server configuration
    server: {
      port: 3006,
      open: true,
      cors: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
