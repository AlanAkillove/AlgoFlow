import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AlgoFlowVisualizations',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', '@algoflow/core', '@algoflow/animation'],
      output: {
        globals: {
          vue: 'Vue',
          '@algoflow/core': 'AlgoFlowCore',
          '@algoflow/animation': 'AlgoFlowAnimation',
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
})
