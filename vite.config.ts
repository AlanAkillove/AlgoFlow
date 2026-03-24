import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@algoflow/core': resolve(__dirname, 'packages/core/src'),
        '@algoflow/animation': resolve(__dirname, 'packages/animation/src'),
        '@algoflow/visualizations': resolve(__dirname, 'packages/visualizations/src'),
      },
    },
    server: {
      port: 3000,
      open: false,
    },
    // Only use lib mode for build, not dev
    ...(isDev ? {} : {
      build: {
        lib: {
          entry: resolve(__dirname, 'packages/visualizations/src/index.ts'),
          name: 'AlgoFlow',
          fileName: 'algoflow',
        },
        rollupOptions: {
          external: ['vue'],
          output: {
            globals: {
              vue: 'Vue',
            },
          },
        },
      },
    }),
  }
})
