import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('@react-three/fiber') || id.includes('@react-three/drei')) {
            return 'three'
          }
          if (id.includes('node_modules/d3')) {
            return 'd3'
          }
          if (id.includes('@xyflow/react')) {
            return 'reactflow'
          }
          return undefined
        },
      },
    },
  },
})
