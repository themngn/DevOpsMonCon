import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['electron-store'] })]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: [
        { find: /^@\/components\/ui(.*)/, replacement: resolve('components/ui') + '$1' },
        { find: /^@\/components(.*)/, replacement: resolve('components') + '$1' },
        { find: '@renderer', replacement: resolve('src/renderer/src') },
        { find: '@', replacement: resolve('src/renderer/src') }
      ]
    },
    plugins: [react(), tailwindcss()]
  }
})
