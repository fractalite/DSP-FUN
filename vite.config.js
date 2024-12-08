import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    base: '/',
    define: {
      'window.__GROQ_API_KEY__': JSON.stringify(env.VITE_GROQ_API_KEY || ''),
      'window.__GROQ_MODEL_ID__': JSON.stringify(env.VITE_GROQ_MODEL_ID || ''),
      'window.__ENABLE_AI__': JSON.stringify(env.VITE_ENABLE_AI === 'true')
    },
    server: {
      port: 4000,
      strictPort: true,
      host: true,
      proxy: {
        '/.netlify/functions': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          sw: resolve(__dirname, 'sw.js'),
          offline: resolve(__dirname, 'offline.html')
        }
      },
      // Ensure service worker and other assets are copied to build
      assetsInclude: ['**/*.js', '**/*.html', 'assets/**'],
      rollupOptions: {
        output: {
          entryFileNames: (chunkInfo) => {
            return chunkInfo.name === 'sw' ? '[name].js' : 'assets/[name]-[hash].js'
          }
        }
      }
    }
  }
})
